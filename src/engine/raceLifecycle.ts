import type { RideSegment } from '../data/raceStages.ts'

export const RACE_LIFECYCLE_STATES = ['NEUTRAL_ROLLOUT','KILOMETRE_ZERO','OFFICIAL_RACING','FINISHED','OPTIONAL_COOLDOWN'] as const
export type RaceLifecycleState = typeof RACE_LIFECYCLE_STATES[number]
export type AuthoredSegmentPurpose = 'neutral-rollout'|'kilometre-zero'|'racing'|'post-finish-cooldown'

/** Legacy content is classified once at load time. Runtime systems consume this explicit map. */
export function segmentPurposes(segments:RideSegment[]):AuthoredSegmentPurpose[]{
  let racingStarted=false
  const hasExplicitStart=segments.length>1&&segments.some(segment=>/kilometre zero/i.test(segment.name))
  return segments.map((segment,index)=>{
    const copy=`${segment.name} ${segment.type}`
    if(/cooldown|cool down/i.test(copy)&&index===segments.length-1)return 'post-finish-cooldown'
    if(hasExplicitStart&&/kilometre zero/i.test(segment.name)){racingStarted=true;return 'kilometre-zero'}
    if(hasExplicitStart&&!racingStarted&&/neutral|rollout|warm-up|warmup/i.test(copy))return 'neutral-rollout'
    racingStarted=true
    return 'racing'
  })
}

export function lifecycleForSegment(purpose:AuthoredSegmentPurpose):RaceLifecycleState{
  if(purpose==='neutral-rollout')return 'NEUTRAL_ROLLOUT'
  if(purpose==='kilometre-zero')return 'KILOMETRE_ZERO'
  if(purpose==='post-finish-cooldown')return 'OPTIONAL_COOLDOWN'
  return 'OFFICIAL_RACING'
}

export function competitiveEventsEligible(state:RaceLifecycleState){return state==='OFFICIAL_RACING'}
export function coachingEligibility(state:RaceLifecycleState){return state==='NEUTRAL_ROLLOUT'?'warm-up':state==='KILOMETRE_ZERO'?'race-start':state==='OFFICIAL_RACING'?'competitive':'recovery'}

export type RolloutPhase='OPENING'|'DEVELOPMENT'|'PREPARATION'
export function rolloutProgress(elapsed:number,duration:number){
  const progress=Math.min(1,Math.max(0,elapsed/Math.max(1,duration)))
  const openingEnd=Math.min(.36,Math.max(.24,90/Math.max(1,duration)))
  const preparationStart=Math.max(openingEnd+.2,Math.min(.8,1-120/Math.max(1,duration)))
  const phase:RolloutPhase=progress<openingEnd?'OPENING':progress<preparationStart?'DEVELOPMENT':'PREPARATION'
  const intensityPercent=45+progress*27 // Z1 through upper Z2; never race intensity.
  return {phase,progress,intensityPercent,openingEnd,preparationStart}
}
