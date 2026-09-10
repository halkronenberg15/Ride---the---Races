import type { RideSegment } from '../data/raceStages.ts'

export type PreRacePhase='PRE_RACE_WARMUP'|'KILOMETRE_ZERO'|'GO'|'RACING'
export type PreRacePlan={warmupSeconds:number;kilometreZeroSeconds:number;officialSegments:RideSegment[];warmupSegment:RideSegment;kilometreZeroSegment?:RideSegment}

/** One start gate for every mass-start event. Explicit authored KM0 sections are
 * extracted from the official road timeline; other races receive the standard
 * prescribed gate without consuming their first authored racing section. */
export function createPreRacePlan(segments:RideSegment[],selectedMinutes:number):PreRacePlan{
 const km0Index=segments.findIndex(segment=>/kilometre zero/i.test(segment.name))
 if(km0Index>=0){
  const warmup=segments.slice(0,km0Index)
  return {warmupSeconds:warmup.reduce((sum,item)=>sum+item.sec,0),kilometreZeroSeconds:segments[km0Index].sec,
   officialSegments:segments.slice(km0Index+1),warmupSegment:warmup[0]??segments[0],kilometreZeroSegment:segments[km0Index]}
 }
 return {warmupSeconds:300,kilometreZeroSeconds:selectedMinutes>90?45:30,officialSegments:segments,warmupSegment:segments[0]}
}

export function preRaceSnapshot(plan:PreRacePlan,rideElapsed:number,skipOffset=0){
 const staged=Math.max(0,rideElapsed+Math.max(0,skipOffset))
 const gateEnd=plan.warmupSeconds+plan.kilometreZeroSeconds
 const officialElapsed=Math.max(0,staged-gateEnd)
 const phase:PreRacePhase=staged<plan.warmupSeconds?'PRE_RACE_WARMUP'
  :staged<gateEnd?'KILOMETRE_ZERO':officialElapsed<1?'GO':'RACING'
 return {phase,officialElapsed,warmupRemaining:Math.max(0,plan.warmupSeconds-staged),
  kilometreZeroRemaining:Math.max(0,gateEnd-staged),gateElapsed:staged,gateEnd}
}

/** Idempotent skip: only the unconsumed warm-up is offset. */
export function skipRemainingWarmup(plan:PreRacePlan,rideElapsed:number,currentOffset=0){
 const staged=rideElapsed+currentOffset
 return staged>=plan.warmupSeconds?currentOffset:currentOffset+(plan.warmupSeconds-staged)
}
