import type { PreRacePhase } from './preRaceLifecycle.ts'

export function lifecycleProfileContext(running:boolean,phase:PreRacePhase|undefined,racingContext:string){
 if(!running)return 'READY'
 if(phase==='PRE_RACE_WARMUP')return 'PRE-RACE STAGING'
 if(phase==='KILOMETRE_ZERO')return 'KILOMETRE ZERO'
 if(phase==='GO')return 'GO'
 return racingContext
}

export function lifecycleJeanMessage(running:boolean,phase:PreRacePhase|undefined,racingMessage:string){
 if(!running)return 'Radio connected. Press Start Ride when you are ready.'
 if(phase==='PRE_RACE_WARMUP')return 'Open the legs progressively. We race after Kilometre Zero.'
 if(phase==='KILOMETRE_ZERO')return 'Hold the line. Build only when I call GO.'
 if(phase==='GO')return 'GO. The race is live.'
 return racingMessage
}

export function completionLabel(completion:number,distanceTravelled:number){
 if(distanceTravelled<=1e-9)return '0% COMPLETE'
 if(completion<1)return '<1% COMPLETE'
 return `${completion<100?Math.min(99,Math.round(completion)):100}% COMPLETE`
}
