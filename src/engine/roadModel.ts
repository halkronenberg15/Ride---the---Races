import type { RideSegment } from '../data/raceStages.ts'
import { buildGradientSections, gradientResistance, gradientSectionIndex, type GradientSection } from './gradientRoad.ts'
import { createStageTimeline, isClimb, type StageSnapshot, type StageTimeline } from './stageEngine.ts'
import { buildSprintPhases, sprintSnapshot, type SprintPhase, type SprintSnapshot } from './sprintPhases.ts'
import type { RaceIdentity } from '../data/raceLibrary.ts'
import { getAuthoritativeProfile } from '../data/courseProfile.ts'

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
  nextGradient: number
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
export function createRoadModel(stageNumber: number, segments: RideSegment[], distanceKm: number, identity?:RaceIdentity, explicitProfile?:Array<string|{distanceKm:number;elevationM:number}>, courseMarkers?:Array<{type:'time-check';routeKm:number;label?:string}>): RoadModel {
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
  const markers: RaceMarker[] = []
  segments.forEach((segment, index) => {
    const start = timeline.segmentStarts[index]
    const position = timeline.snapshot(start).courseProgress
    if (/kilometre zero|race start|official time trial start/i.test(text(segment))) markers.push({ key: `km0-${index}`, type: 'kilometre-zero', label: 'KM 0', position, at: start, ...markerGeometry(profileYAt(position)), color:'#ffd400' })
    if (/sprint/i.test(text(segment)) && !/finish/i.test(text(segment))) {
      const at = start + segment.sec
      const position=timeline.snapshot(at).courseProgress; markers.push({ key: `sprint-${index}`, type: 'sprint', label: 'SPR', position, at, ...markerGeometry(profileYAt(position)), color:identity?.pointsColor??'#38a852' })
    }
    if (isClimb(segment)) {
      const at = start + segment.sec
      const position=timeline.snapshot(at).courseProgress; markers.push({ key: `kom-${index}`, type: 'kom', label: 'KOM', position, at, ...markerGeometry(profileYAt(position)), color:identity?.komColor??'#ef3340' })
    }
  })
  courseMarkers?.forEach((marker,index)=>{
    const position=Math.min(1,Math.max(0,marker.routeKm/distanceKm)); const at=elapsedAtCourseDistance(marker.routeKm)
    markers.push({key:`time-check-${index}`,type:'time-check',label:marker.label??'TT',position,at,...markerGeometry(profileYAt(position)),color:identity?.timeCheckColor??'#55dff7'})
  })
  markers.push({ key: 'finish', type: 'finish', label: 'FINISH', position: 1, at: timeline.duration, ...markerGeometry(profileYAt(1)), color:identity?.finishColor??'#ffffff' })

  return {
    ...timeline,
    points,
    profileSourceKind: explicitPoints.length>=2?'authoritative':'generated-fallback',
    profilePoints: points.map((point) => `${(point.position * 100).toFixed(3)},${profileYAt(point.position).toFixed(3)}`),
    markers,
    elevationAt,
    elapsedAtCourseDistance,
    actionTargets(elapsedSeconds) {
      const elapsed = Math.max(0, Math.min(timeline.duration, elapsedSeconds))
      const snapshot = timeline.snapshot(elapsed)
      const index = snapshot.segmentIndex
      const segment = snapshot.segment
      const gradients = sectionGradients[index]
      const gradientIndex = gradientSectionIndex(gradients, snapshot.segmentProgress)
      const sprint = sprintSnapshot(sectionSprints[index], snapshot.elapsedInSegment)
      const segmentStart = timeline.segmentStarts[index]
      const current: ActionTarget = sprint ? {
        name: sprint.name, type: 'sprint', zone: sprint.zone, power: sprint.power,
        cadence: sprint.cadence, resistance: sprint.resistance, at: elapsed - snapshot.elapsedInSegment + sprint.start,
        remaining: sprint.remaining,
      } : {
        name: gradients.length ? `${segment.name} · ${gradients[gradientIndex].gradient}%` : segment.name, type: gradients.length ? 'gradient' : 'section', zone: segment.zone,
        power: segment.power, cadence: segment.cadence,
        resistance: gradients.length ? gradientResistance(segment, gradients, gradientIndex) : segment.resistance,
        at: gradients.length ? segmentStart + gradients[gradientIndex].start * segment.sec : segmentStart,
        remaining: gradients.length ? Math.max(0, gradients[gradientIndex].end * segment.sec - snapshot.elapsedInSegment) : snapshot.segmentRemaining,
        gradient: gradients[gradientIndex]?.gradient,
      }

      const candidates: ActionTarget[] = []
      const nextSprint = sprint && sectionSprints[index][sprint.index + 1]
      if (nextSprint) candidates.push({ ...nextSprint, type: 'sprint', at: segmentStart + nextSprint.start, remaining: nextSprint.end - nextSprint.start })
      const nextGradientSection = gradients[gradientIndex + 1]
      if (!sprint && nextGradientSection) candidates.push({
        name: `${segment.name} · ${nextGradientSection.gradient}%`, type: 'gradient', zone: segment.zone,
        power: segment.power, cadence: segment.cadence,
        resistance: gradientResistance(segment, gradients, gradientIndex + 1), gradient: nextGradientSection.gradient,
        at: segmentStart + nextGradientSection.start * segment.sec,
        remaining: (nextGradientSection.end - nextGradientSection.start) * segment.sec,
      })
      const nextSegment = segments[index + 1]
      if (nextSegment) {
        const nextStart = timeline.segmentStarts[index + 1]
        const nextPhases = sectionSprints[index + 1]
        const nextGradients = sectionGradients[index + 1]
        const firstPhase = nextPhases[0]
        candidates.push(firstPhase ? { ...firstPhase, type: 'sprint', at: nextStart, remaining: firstPhase.end - firstPhase.start } : {
          name: nextSegment.name, type: nextGradients.length ? 'gradient' : 'section', zone: nextSegment.zone,
          power: nextSegment.power, cadence: nextSegment.cadence,
          resistance: nextGradients.length ? gradientResistance(nextSegment, nextGradients, 0) : nextSegment.resistance,
          gradient: nextGradients[0]?.gradient, at: nextStart, remaining: nextSegment.sec,
        })
      }
      const next = elapsed >= timeline.duration ? null : candidates.filter((item) => item.at > elapsed).sort((a, b) => a.at - b.at)[0] ?? null
      return { current, next, timeUntilNext: next ? Math.max(0, next.at - elapsed) : null }
    },
    roadSnapshot(elapsedSeconds) {
      const base = timeline.snapshot(elapsedSeconds)
      const gradientSections = sectionGradients[base.segmentIndex]
      const sprintPhases = sectionSprints[base.segmentIndex]
      const sprintPhase = sprintSnapshot(sprintPhases, base.elapsedInSegment)
      const gradientIndex = gradientSectionIndex(gradientSections, base.segmentProgress)
      const geometryGradient=()=>{
        const distance=base.courseDistance
        const rightIndex=points.findIndex(point=>point.position*distanceKm>distance+1e-9)
        if(rightIndex<=0)return 0
        const left=points[rightIndex-1],right=points[rightIndex]
        return (right.elevation-left.elevation)/Math.max(.001,(right.position-left.position)*distanceKm)*.1
      }
      const gradient = officialProfile ? geometryGradient() : gradientSections[gradientIndex]?.gradient ?? (/descent/i.test(text(base.segment)) ? -3.2 : 0)
      const priorIndex=base.segmentIndex-1
      const atPriorSummit=priorIndex>=0&&isClimb(segments[priorIndex])
        && Math.abs(base.elapsed-timeline.segmentStarts[base.segmentIndex])<1e-9
      const climbIndex=atPriorSummit?priorIndex:(isClimb(base.segment)?base.segmentIndex:-1)
      const climbActive=climbIndex>=0
      const climbStartDistance=climbActive?Math.min(distanceKm,segments[climbIndex].routeKm):null
      const summitDistance=climbActive?Math.min(distanceKm,segments[climbIndex+1]?.routeKm??distanceKm):null
      const distanceToSummit=summitDistance===null?0:Math.max(0,summitDistance-base.courseDistance)
      const climbProgress=climbActive&&summitDistance!>climbStartDistance!
        ? Math.min(1,Math.max(0,(base.courseDistance-climbStartDistance!)/(summitDistance!-climbStartDistance!))):0
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
        nextGradient: officialProfile ? geometryGradient() : gradientSections[Math.min(gradientIndex + 1, gradientSections.length - 1)]?.gradient ?? gradient,
        climbProgress,
        activeClimbId: climbActive?`${stageNumber}-${climbIndex}-${segments[climbIndex].name}`:null,
        climbStartDistance,
        summitDistance,
        distanceToSummit,
        estimatedTimeToSummit: summitDistance===null?0:Math.max(0,elapsedAtCourseDistance(summitDistance)-base.elapsed),
        climbAverageGradient,
        resistance: sprintPhase?.resistance ?? (gradientSections.length ? gradientResistance(base.segment, gradientSections, gradientIndex) : base.segment.resistance),
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
