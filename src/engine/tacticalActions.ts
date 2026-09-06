export const TACTICAL_STATES=['PELOTON','ATTACKING','BREAKAWAY','CHASING','CAUGHT','DROPPED','RETURNING_TO_PELOTON'] as const
export type TacticalState=typeof TACTICAL_STATES[number]
export type TacticalTransition={startedAt:number;durationSeconds:number;from:TacticalState;progress:number}
export type TacticalAction='ATTACK'|'JOIN_BREAKAWAY'|'CHASE'|'HOLD_BREAK'|'RESPOND'|'SIT_UP'|'RETURN_TO_PELOTON'

export function availableTacticalActions(state:TacticalState,officialRacing:boolean):TacticalAction[]{
 if(!officialRacing)return []
 if(state==='PELOTON')return ['ATTACK','JOIN_BREAKAWAY','CHASE','RESPOND']
 if(state==='ATTACKING')return ['JOIN_BREAKAWAY','SIT_UP','RETURN_TO_PELOTON']
 if(state==='BREAKAWAY')return ['HOLD_BREAK','SIT_UP','RETURN_TO_PELOTON']
 if(state==='CHASING')return ['RESPOND','SIT_UP','RETURN_TO_PELOTON']
 if(state==='CAUGHT'||state==='DROPPED')return ['RETURN_TO_PELOTON']
 return []
}
export function applyTacticalAction(state:TacticalState,action:TacticalAction,elapsed:number):{state:TacticalState;transition:null|TacticalTransition}{
 if(action==='RETURN_TO_PELOTON'||action==='SIT_UP')return {state:'RETURNING_TO_PELOTON',transition:{startedAt:elapsed,durationSeconds:45,from:state,progress:0}}
 return {state:action==='ATTACK'?'ATTACKING':action==='JOIN_BREAKAWAY'||action==='HOLD_BREAK'?'BREAKAWAY':action==='CHASE'||action==='RESPOND'?'CHASING':state,transition:null}
}
export function resolveTacticalTransition(state:TacticalState,transition:TacticalTransition|null,elapsed:number){
 if(state!=='RETURNING_TO_PELOTON'||!transition)return {state,transition,effortMultiplier:state==='PELOTON'?1:1.08}
 const progress=Math.min(1,Math.max(0,(elapsed-transition.startedAt)/transition.durationSeconds))
 return progress>=1?{state:'PELOTON' as TacticalState,transition:null,effortMultiplier:1}:{state,transition:{...transition,progress},effortMultiplier:1.08-.08*progress}
}
