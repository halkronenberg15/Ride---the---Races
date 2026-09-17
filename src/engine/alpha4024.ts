import type { JeanTimelineEvent } from './stageEngine.ts'

export const JEAN_PRESENTATION_MS = 7_000
export const MIN_CLIMB_LENGTH_KM = 1
export const MIN_CLIMB_GAIN_M = 30
export const MIN_CLIMB_AVERAGE_GRADIENT = 2
export const CLIMB_ENTRY_PROGRESS=.01
export const CLIMB_EXIT_PROGRESS=.995
export const CLIMB_MINIMUM_VISIBLE_SECONDS=8

export type ClimbPresentationState={activeClimbId:string|null;automaticEnteredAt:number|null;minimumVisibleUntil:number|null;manualSelection:'AUTO'|'FULL_STAGE'|'CLIMB';completedClimbIds:string[];lastCanonicalProgress:number}
export const initialClimbPresentationState=():ClimbPresentationState=>({activeClimbId:null,automaticEnteredAt:null,minimumVisibleUntil:null,manualSelection:'AUTO',completedClimbIds:[],lastCanonicalProgress:0})
export type ClimbTransitionInput={eligibleClimbId:string|null;climbProgress:number|null;officialElapsed:number;canonicalProgress?:number;canonicalEnded?:boolean}

/** Presentation state only: canonical progress supplies every transition. */
export function transitionClimbPresentation(state:ClimbPresentationState,input:ClimbTransitionInput):ClimbPresentationState{
 const progress=Math.max(0,Math.min(1,input.climbProgress??0)),last=Math.max(state.lastCanonicalProgress,input.canonicalProgress??progress)
 if(state.activeClimbId){
  const ended=input.canonicalEnded||progress>=1||input.eligibleClimbId!==state.activeClimbId||(progress>=CLIMB_EXIT_PROGRESS&&input.officialElapsed>=(state.minimumVisibleUntil??0))
  if(ended)return {...state,activeClimbId:null,automaticEnteredAt:null,minimumVisibleUntil:null,completedClimbIds:Array.from(new Set([...state.completedClimbIds,state.activeClimbId])),lastCanonicalProgress:last}
  return {...state,lastCanonicalProgress:last}
 }
 if(!input.eligibleClimbId||state.completedClimbIds.includes(input.eligibleClimbId)||state.manualSelection==='FULL_STAGE'||progress<CLIMB_ENTRY_PROGRESS)return {...state,lastCanonicalProgress:last}
 return {...state,activeClimbId:input.eligibleClimbId,automaticEnteredAt:input.officialElapsed,minimumVisibleUntil:input.officialElapsed+CLIMB_MINIMUM_VISIBLE_SECONDS,lastCanonicalProgress:progress}
}

export function climbPresentationMode(state:ClimbPresentationState,eligibleActive:boolean):'FULL_STAGE'|'CLIMB'{
 if(state.manualSelection==='FULL_STAGE')return 'FULL_STAGE'
 if(state.manualSelection==='CLIMB')return eligibleActive?'CLIMB':'FULL_STAGE'
 return state.activeClimbId?'CLIMB':'FULL_STAGE'
}

export function qualifiesForClimbView(candidate:{lengthKm:number;gainM:number;explicitlyAuthored?:boolean}){
 return Boolean(candidate.explicitlyAuthored)||(candidate.lengthKm>=MIN_CLIMB_LENGTH_KM&&candidate.gainM>=MIN_CLIMB_GAIN_M&&candidate.gainM/(candidate.lengthKm*10)>=MIN_CLIMB_AVERAGE_GRADIENT)
}

export function officialStageTime(total:number,elapsed:number){
 const officialTotal=Math.max(0,total),officialElapsed=Math.min(officialTotal,Math.max(0,elapsed))
 return {total:officialTotal,elapsed:officialElapsed,remaining:Math.max(0,officialTotal-officialElapsed)}
}

export function jeanEventValidity(event:JeanTimelineEvent,segmentDuration:number){
 const validity=Math.max(5,Math.min(20,segmentDuration*.25))
 return {id:event.key,opensAt:event.at,expiresAt:event.at+validity}
}

export function validJeanEvents(events:JeanTimelineEvent[],now:number,segmentDurations:number[],delivered:ReadonlySet<string>){
 return events.filter(event=>!delivered.has(event.key)&&now>=event.at&&now<=jeanEventValidity(event,segmentDurations[event.segmentIndex]??20).expiresAt)
}

export type JeanCuePriority='lifecycle'|'safety'|'tactical'|'course'|'ambient'
export type JeanCueContract={id:string;message:string;validFrom:number;expiresAt:number;priority:JeanCuePriority;canonicalProgress:number;source:'timeline'|'fixed'|'ambient'|'sprint'|'final'}
export function evaluateJeanCue(cue:JeanCueContract,now:number,consumed:ReadonlySet<string>):'WAIT'|'DELIVER'|'DROP'{
 if(consumed.has(cue.id))return 'DROP'
 if(now<cue.validFrom)return 'WAIT'
 return now<=cue.expiresAt?'DELIVER':'DROP'
}

export function scheduleJeanDismissal(message:string,createdAtMs:number,nowMs:number,schedule:(callback:()=>void,delay:number)=>unknown,cancel:(handle:unknown)=>void,onDismiss:(message:string)=>void){
 const remaining=JEAN_PRESENTATION_MS-Math.max(0,nowMs-createdAtMs)
 if(remaining<=0){onDismiss(message);return()=>{}}
 const handle=schedule(()=>onDismiss(message),remaining)
 return()=>cancel(handle)
}
