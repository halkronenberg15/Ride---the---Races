import type { RoadModel, RoadSnapshot } from './roadModel.ts'
import type { GradientSection } from './gradientRoad.ts'
import { mergeMeaningfulGradientSections } from './gradientRoad.ts'

export type CourseProfileMode='FULL_STAGE'|'CLIMB_APPROACH'|'CLIMB'
export type CanonicalCoursePosition={
 officialElapsed:number; completion:number; remainingDistance:number; fullProfileCoordinate:number
 currentSector:string; currentClimbId:string|null; distanceToClimbEntrance:number|null
 climbCoordinate:number|null; climbCompletion:number|null; distanceToSummit:number|null; timeToSummit:number|null
 currentGradientSection:GradientSection|null; nextGradientSection:GradientSection|null
 distanceToNextGradientBoundary:number|null; currentTargets:RoadSnapshot['livePrescription'];nextTargets:ReturnType<RoadModel['actionTargets']>['next'];finished:boolean
 profileMode:CourseProfileMode; gradientSections:GradientSection[]
}

export const CLIMB_APPROACH_KM=1.5

/**
 * Read-only projection of the road model. This is the sole runtime source for
 * every cockpit distance, clock, target boundary and profile coordinate.
 */
export function canonicalCoursePosition(model:RoadModel,elapsedSeconds:number):CanonicalCoursePosition{
 const road=model.roadSnapshot(elapsedSeconds)
 const summitClimb=model.climbs.find(climb=>Math.abs(climb.summitDistance-road.courseDistance)<1e-9)
 const nextClimb=road.activeClimbId?null:model.climbs.find(climb=>climb.startDistance>road.courseDistance+.000001)
 const onClimb=road.activeClimbId!==null||Boolean(summitClimb)
 const sections=mergeMeaningfulGradientSections(road.gradientSections)
 const progress=road.climbProgress
 const index=onClimb?Math.max(0,sections.findIndex((section,item)=>progress>=section.start&&(progress<section.end||item===sections.length-1))):-1
 const current=index>=0?sections[index]??null:null
 const next=current?sections.slice(index+1).find(section=>Math.abs(section.gradient-current.gradient)>=.5)??null:null
 const climbLength=road.climbStartDistance!==null&&road.summitDistance!==null?road.summitDistance-road.climbStartDistance:0
 const boundaryDistance=current?Math.max(0,(current.end-progress)*climbLength):null
 const finished=road.raceFinished
 const remaining=finished?0:Math.max(0,model.distanceKm-road.courseDistance)
 const completion=finished?100:remaining>1e-9?Math.min(99.9,road.courseProgress*100):100
 const entrance=nextClimb?Math.max(0,nextClimb.startDistance-road.courseDistance):null
 return {
  officialElapsed:road.officialRaceElapsed,completion,remainingDistance:remaining,fullProfileCoordinate:finished?1:road.courseProgress,
  currentSector:road.segment.name,currentClimbId:road.activeClimbId??summitClimb?.id??null,distanceToClimbEntrance:entrance,
  climbCoordinate:onClimb?(summitClimb?1:progress):null,climbCompletion:onClimb?(summitClimb||road.distanceToSummit<=1e-7?100:Math.min(99.9,progress*100)):null,
  distanceToSummit:onClimb?(summitClimb?0:road.distanceToSummit):null,timeToSummit:onClimb?(summitClimb||road.distanceToSummit<=1e-7?0:road.estimatedTimeToSummit):null,
  currentGradientSection:current,nextGradientSection:next,distanceToNextGradientBoundary:boundaryDistance,
  currentTargets:road.livePrescription,nextTargets:model.actionTargets(elapsedSeconds).next,finished,
  profileMode:onClimb?'CLIMB':entrance!==null&&entrance<=CLIMB_APPROACH_KM?'CLIMB_APPROACH':'FULL_STAGE',gradientSections:sections,
 }
}

/** At most five sections surround the rider without changing canonical order. */
export function mobileGradientWindow(sections:readonly GradientSection[],activeIndex:number,limit=5){
 const size=Math.min(limit,sections.length);const start=Math.max(0,Math.min(sections.length-size,activeIndex-Math.floor(size/2)))
 return {start,sections:sections.slice(start,start+size)}
}
