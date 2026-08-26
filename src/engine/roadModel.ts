import type { RideSegment } from '../data/raceStages.ts'
import { buildGradientSections, gradientSectionIndex, type GradientSection } from './gradientRoad.ts'
import { createStageTimeline, isClimb, type StageSnapshot, type StageTimeline } from './stageEngine.ts'
import { buildSprintPhases, sprintSnapshot, type SprintPhase, type SprintSnapshot } from './sprintPhases.ts'
import type { RaceIdentity } from '../data/raceLibrary.ts'
import { getAuthoritativeProfile } from '../data/courseProfile.ts'
import { applyTerrainModifier, resolvePrescriptionAtState, type PrescriptionState } from './prescription.ts'
import { markerPosition, resolveOfficialCourseMarkers, type OfficialCourseMarker } from '../data/courseMarkers.ts'

export type RaceMarkerType = 'kilometre-zero' | 'sprint' | 'kom' | 'time-check' | 'finish'
export const COURSE_MARKER_HEIGHT = 28
export type RaceMarker = { key: string; type: RaceMarkerType; label: string; position: number; at: number; localY:number; topY:number; color:string }
export type RoadPoint = { position: number; elevation: number }
export type RoadSnapshot = StageSnapshot & {
  roadPosition: number
  elevation: number
  profileY: number
  gradientSections: GradientSection[]
  gradientIndex: number
  gradient: number
  nextGradient: number | null
  climbProgress: number
  activeClimbId: string | null
  climbStartDistance: number | null
  summitDistance: number | null
  distanceToSummit: number
  estimatedTimeToSummit: number
  climbAverageGradient: number
  resistance: string
  sprintPhases: SprintPhase[]
  sprintPhase: SprintSnapshot | null
}

export type ActionTarget = {
  name: string
  type: 'section' | 'sprint' | 'gradient'
  zone: string
  power: string
  cadence: string
  resistance: string
  at: number
  remaining?: number
  gradient?: number
}

export type ActionTargets = { current: ActionTarget; next: ActionTarget | null; timeUntilNext: number | null }

export type RoadModel = StageTimeline & {
  points: RoadPoint[]
  profilePoints: string[]
  profileSourceKind: 'authoritative' | 'generated-fallback'
  markers: RaceMarker[]
  roadSnapshot: (elapsedSeconds: number) => RoadSnapshot
  elevationAt: (position: number) => number
  actionTargets: (elapsedSeconds: number) => ActionTargets
  prescriptionAt: (elapsedSeconds: number) => PrescriptionState
  elapsedAtCourseDistance: (courseDistance: number) => number
  debugSnapshot: (elapsedSeconds: number) => CourseDebugSnapshot
}

export type CourseDebugSnapshot = {
  elapsedRideTime: number; courseDistance: number; courseProgress: number
  currentSectionId: string; sectionStartCourseDistance: number; sectionEndCourseDistance: number
  activeClimbId: string | null; climbStartDistance: number | null; summitDistance: number | null
  distanceToSummit: number
}

const text = (segment: Pick<RideSegment, 'name' | 'type'>) => `${segment.name} ${segment.type}`

/** One road coordinate and geography shared by the tracker, gradients, resistance and coaching. */
export function markerGeometry(localY:number){return {localY,topY:localY-COURSE_MARKER_HEIGHT,height:COURSE_MARKER_HEIGHT}}
export function markerLabelOffset(position:number, nearbyPositions:number[]=[]){
  const edgeOffset=position>.94?-112:position<.06?0:-50
  const collisionIndex=nearbyPositions.filter(value=>value<position&&position-value<.055).length
  return { translateX:edgeOffset, translateY:collisionIndex%2?-11:0 }
}
export function createRoadModel(stageNumber: number, segments: RideSegment[], distanceKm: number, identity?:RaceIdentity, explicitProfile?:Array<string|{distanceKm:number;elevationM:number}>, officialCourseMarkers?:OfficialCourseMarker[], raceName=identity?.shortName??'Professional race', strategy='Balanced', riderFtp=206): RoadModel {
  const timeline = createStageTimeline(segments, distanceKm)
  const sectionGradients = segments.map((segment, index) => isClimb(segment)
    ? buildGradientSections(`${stageNumber}-${index}-${segment.name}-${segment.type}`, segment.sec, segment.zone)
    : [])
  const sectionSprints = segments.map(buildSprintPhases)
  const raw: RoadPoint[] = [{ position: 0, elevation: 0 }]
  let elevation = 0
  if (!explicitProfile?.length) segments.forEach((segment, index) => {
    const start = timeline.segmentStarts[index] / timeline.duration
    const end = (timeline.segmentStarts[index] + segment.sec) / timeline.duration
    const gradients = sectionGradients[index]
    if (gradients.length) {
      gradients.forEach((block) => {
        elevation += block.gradient * (end - start) * 1.8
        raw.push({ position: start + block.end * (end - start), elevation })
      })
    } else {
      const pitch = /descent/i.test(text(segment)) ? -3.2 : /recovery|cooldown/i.test(text(segment)) ? -0.5 : /rolling|hilly/i.test(text(segment)) ? 0.8 : 0.15
      elevation += pitch * (end - start) * 1.8
      raw.push({ position: end, elevation })
    }
  })
  const officialProfile=explicitProfile?.some(value=>typeof value!=='string')
  const officialInput=(explicitProfile??[]).filter((value):value is {distanceKm:number;elevationM:number}=>typeof value!=='string')
  const renderProfile=officialInput.length===explicitProfile?.length?getAuthoritativeProfile({profilePoints:officialInput,verification:{profile:true}}):explicitProfile??[]
  const explicitPoints=renderProfile.map(value=>{if(typeof value!=='string')return {position:value.distanceKm/distanceKm,elevation:value.elevationM};const [x,y]=value.split(',').map(Number);return {position:x/100,elevation:y}}).filter(point=>Number.isFinite(point.position)&&Number.isFinite(point.elevation)).sort((a,b)=>a.position-b.position)
  const min = Math.min(...raw.map((point) => point.elevation))
  const max = Math.max(...raw.map((point) => point.elevation))
  const span = Math.max(1, max - min)
  const points = explicitPoints.length>=2 ? explicitPoints : raw.map((point) => ({ ...point, elevation: 82 - ((point.elevation - min) / span) * 62 }))
  const pointMin=Math.min(...points.map(point=>point.elevation)); const pointMax=Math.max(...points.map(point=>point.elevation)); const pointSpan=Math.max(1,pointMax-pointMin)
  const elevationAt = (position: number) => {
    const p = Math.min(1, Math.max(0, position))
    const rightIndex = points.findIndex((point) => point.position >= p)
    if (rightIndex <= 0) return points[0].elevation
    const right = points[rightIndex]
    const left = points[rightIndex - 1]
    const local = (p - left.position) / Math.max(Number.EPSILON, right.position - left.position)
    return left.elevation + (right.elevation - left.elevation) * local
  }
  const profileYAt=(position:number)=>officialProfile?92-((elevationAt(position)-pointMin)/pointSpan)*80:elevationAt(position)
  const ascentRuns = officialInput.reduce<Array<{start:number;summit:number}>>((runs, point, index) => {
    if (index >= officialInput.length - 1 || officialInput[index + 1].elevationM <= point.elevationM) return runs
    const prior = runs.at(-1)
    if (prior?.summit === point.distanceKm) prior.summit = officialInput[index + 1].distanceKm
    else runs.push({ start: point.distanceKm, summit: officialInput[index + 1].distanceKm })
    return runs
  }, [])
  // Workout labels select the relevant rise, but profile geometry owns both bounds.
  const climbIntervals = segments.flatMap((segment,index) => {
    if (!isClimb(segment) || !ascentRuns.length) return []
    const anchor = segment.routeKm
    const run = ascentRuns.reduce((best,item) => {
      const distance = anchor < item.start ? item.start-anchor : anchor > item.summit ? anchor-item.summit : 0
      const bestDistance = anchor < best.start ? best.start-anchor : anchor > best.summit ? anchor-best.summit : 0
      return distance < bestDistance ? item : best
    })
    return [{...run,index,id:`${stageNumber}-${index}-${segment.name}`}]
  })
  // The containing pair is the authoritative adjacent geographic interval.
  // At a shared boundary the interval ending there wins, giving the summit an
  // exact final ascent sample; the descent begins immediately after it.
  const geometryGradientAt=(courseDistance:number)=>{
    if (!officialProfile) return 0
    const rightIndex=Math.max(1,officialInput.findIndex(point=>point.distanceKm>=courseDistance))
    const right=officialInput[Math.min(officialInput.length-1,rightIndex)]
    const left=officialInput[Math.min(officialInput.length-2,rightIndex-1)]
    return (right.elevationM-left.elevationM)/Math.max(.001,(right.distanceKm-left.distanceKm)*10)
  }
  const geometryGradientSections=(startDistance:number,endDistance:number):GradientSection[]=>{
    const length=Math.max(Number.EPSILON,endDistance-startDistance)
    // At most six readable, distance-equal blocks. Workout duration and
    // authored sector boundaries never select these geographic intervals.
    const count=Math.max(1,Math.min(6,Math.ceil(length/2)))
    const boundaries=Array.from({length:count+1},(_,index)=>startDistance+length*index/count)
    return boundaries.slice(0,-1).map((start,index)=>({
      start:(start-startDistance)/length,
      end:(boundaries[index+1]-startDistance)/length,
      gradient:Number(geometryGradientAt((start+boundaries[index+1])/2).toFixed(1)),
    }))
  }
  const elapsedAtCourseDistance=(courseDistance:number)=>{
    const target=Math.min(distanceKm,Math.max(0,courseDistance))
    if(target>=distanceKm)return timeline.duration
    for(let index=0;index<segments.length;index+=1){
      const start=Math.min(distanceKm,Math.max(0,segments[index].routeKm))
      const end=Math.min(distanceKm,Math.max(start,segments[index+1]?.routeKm??distanceKm))
      if(target<=end&&end>start)return timeline.segmentStarts[index]+((target-start)/(end-start))*segments[index].sec
    }
    return timeline.duration
  }
  const markerType = (type:OfficialCourseMarker['type']):RaceMarkerType => type==='km-zero'||type==='start'?'kilometre-zero':type==='tt-check'?'time-check':type==='bonus'?'sprint':type
  const markerColor = (type:RaceMarkerType) => type==='kilometre-zero'?'#ffd400':type==='sprint'?identity?.pointsColor??'#38a852':type==='kom'?identity?.komColor??'#ef3340':type==='time-check'?identity?.timeCheckColor??'#55dff7':identity?.finishColor??'#ffffff'
  const markers:RaceMarker[]=resolveOfficialCourseMarkers(officialCourseMarkers,{race:raceName,stageNumber,officialDistanceKm:distanceKm}).map(marker=>{
    const position=markerPosition(marker,distanceKm)
    return {key:marker.id,type:markerType(marker.type),label:marker.label,position,at:elapsedAtCourseDistance(marker.routeKm),...markerGeometry(profileYAt(position)),color:markerColor(markerType(marker.type))}
  })

  return {
    ...timeline,
    points,
    profileSourceKind: explicitPoints.length>=2?'authoritative':'generated-fallback',
    profilePoints: points.map((point) => `${(point.position * 100).toFixed(3)},${profileYAt(point.position).toFixed(3)}`),
    markers,
    elevationAt,
    elapsedAtCourseDistance,
    actionTargets(elapsedSeconds) {
      const prescriptions = resolvePrescriptionAtState(segments, timeline.segmentStarts, elapsedSeconds)
      const snapshot = timeline.snapshot(elapsedSeconds)
      const current = prescriptions.currentPrescription
      const next = prescriptions.nextPrescription
      return {
        current: { name: snapshot.segment.name, type: 'section' as const, ...current, at: timeline.segmentStarts[snapshot.segmentIndex], remaining: prescriptions.currentRemaining },
        next: next ? { name: segments[snapshot.segmentIndex + 1].name, type: 'section' as const, ...next, at: timeline.segmentStarts[snapshot.segmentIndex + 1], remaining: prescriptions.nextPrescriptionDuration ?? 0 } : null,
        timeUntilNext: prescriptions.timeUntilNextPrescription,
      }
    },
    prescriptionAt(elapsedSeconds) {
      const state=resolvePrescriptionAtState(segments,timeline.segmentStarts,elapsedSeconds,strategy)
      const road=this.roadSnapshot(elapsedSeconds)
      return {...state,currentPrescription:applyTerrainModifier(state.currentPrescription,road.gradient,state.currentPrescription.segmentId===`${road.segmentIndex}-${road.segment.name}`?road.segment:segments[road.segmentIndex],riderFtp)}
    },
    roadSnapshot(elapsedSeconds) {
      const base = timeline.snapshot(elapsedSeconds)
      const authoredGradientSections = sectionGradients[base.segmentIndex]
      const sprintPhases = sectionSprints[base.segmentIndex]
      const sprintPhase = sprintSnapshot(sprintPhases, base.elapsedInSegment)
      const interval=officialProfile?climbIntervals.find(item=>base.courseDistance>=item.start-1e-9&&base.courseDistance<=item.summit+1e-9):null
      const priorIndex=base.segmentIndex-1
      const atPriorSummit=!officialProfile&&priorIndex>=0&&isClimb(segments[priorIndex])&&Math.abs(base.elapsed-timeline.segmentStarts[base.segmentIndex])<1e-9
      const climbIndex=officialProfile?(interval?.index??-1):(atPriorSummit?priorIndex:(isClimb(base.segment)?base.segmentIndex:-1))
      const climbActive=climbIndex>=0
      const climbStartDistance=officialProfile?(interval?.start??null):(climbActive?timeline.snapshot(timeline.segmentStarts[climbIndex]).courseDistance:null)
      const summitDistance=officialProfile?(interval?.summit??null):(climbActive?timeline.snapshot(timeline.segmentStarts[climbIndex]+segments[climbIndex].sec).courseDistance:null)
      const gradientSections=officialProfile
        ? climbStartDistance!==null&&summitDistance!==null ? geometryGradientSections(climbStartDistance,summitDistance) : []
        : authoredGradientSections
      const geographicClimbProgress=climbActive&&summitDistance!>climbStartDistance!
        ? Math.min(1,Math.max(0,(base.courseDistance-climbStartDistance!)/(summitDistance!-climbStartDistance!))):0
      const gradientIndex=gradientSectionIndex(gradientSections,officialProfile?geographicClimbProgress:base.segmentProgress)
      const gradient=officialProfile?Number(geometryGradientAt(base.courseDistance).toFixed(1))
        :gradientSections[gradientIndex]?.gradient??(/descent/i.test(text(base.segment))?-3.2:0)
      const distanceToSummit=summitDistance===null?0:Math.max(0,summitDistance-base.courseDistance)
      const climbProgress=geographicClimbProgress
      const climbAverageGradient=climbActive&&summitDistance!>climbStartDistance!
        ? (elevationAt(summitDistance!/distanceKm)-elevationAt(climbStartDistance!/distanceKm))
          /(summitDistance!-climbStartDistance!)*.1:0
      return {
        ...base,
        roadPosition: base.courseProgress,
        elevation: elevationAt(base.courseProgress),
        profileY: profileYAt(base.courseProgress),
        gradientSections,
        sprintPhases,
        sprintPhase,
        gradientIndex,
        gradient,
        nextGradient: climbActive
          ? gradientSections[gradientIndex + 1]?.gradient ?? null
          : officialProfile ? Number(geometryGradientAt(Math.min(distanceKm,base.courseDistance+.8)).toFixed(1)) : gradient,
        climbProgress,
        activeClimbId: climbActive?(interval?.id??`${stageNumber}-${climbIndex}-${segments[climbIndex].name}`):null,
        climbStartDistance,
        summitDistance,
        distanceToSummit,
        estimatedTimeToSummit: summitDistance===null?0:Math.max(0,elapsedAtCourseDistance(summitDistance)-base.elapsed),
        climbAverageGradient,
        resistance: resolvePrescriptionAtState(segments, timeline.segmentStarts, elapsedSeconds).currentPrescription.resistance,
      }
    },
    debugSnapshot(elapsedSeconds){
      const snapshot=this.roadSnapshot(elapsedSeconds)
      return {elapsedRideTime:snapshot.elapsed,courseDistance:snapshot.courseDistance,courseProgress:snapshot.courseProgress,
        currentSectionId:`${snapshot.segmentIndex}-${snapshot.segment.name}`,sectionStartCourseDistance:snapshot.sectionStartCourseDistance,
        sectionEndCourseDistance:snapshot.sectionEndCourseDistance,activeClimbId:snapshot.activeClimbId,
        climbStartDistance:snapshot.climbStartDistance,summitDistance:snapshot.summitDistance,distanceToSummit:snapshot.distanceToSummit}
    },
  }
}
