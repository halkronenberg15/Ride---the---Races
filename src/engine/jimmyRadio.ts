export type JimmyRadioContext='TRAINING'|'RACE'
export type JimmyRadioPriority='ambient'|'course'|'tactical'|'safety'|'lifecycle'

const priorityRank:Record<JimmyRadioPriority,number>={
 ambient:0,
 course:1,
 tactical:2,
 safety:3,
 lifecycle:4,
}

export function isHardWorkZone(zone?:string){
 return /VO2|Threshold|Sweet Spot|Sustained climbing|Anaerobic/i.test(zone??'')
}

/**
 * Training transitions should prepare the rider without narrating every second.
 * Steady work gets one 30-second heads-up. Hard work also gets a 10-second brace.
 */
export function jimmyTransitionCue(secondsRemaining:number,nextTitle?:string,nextZone?:string){
 if(!nextTitle)return null
 if(secondsRemaining===30)return `Thirty seconds. ${nextTitle} next.`
 if(secondsRemaining===10&&isHardWorkZone(nextZone))return `Ten seconds. Get ready for ${nextTitle}.`
 return null
}

/** Ambient radio is deliberately sparse. Course/tactical events provide the texture. */
export function jimmyAmbientDelay(seed:number,context:JimmyRadioContext='TRAINING'){
 const n=Math.abs(Math.floor(seed))
 return context==='RACE'?120+(n%91):210+(n%91)
}

export function jimmyOpening(sectionTitle:string,guidance:string){
 const first=(guidance.trim().match(/^.*?[.!?](?:\s|$)/)?.[0]??guidance.trim()).trim()
 return `Ride is live. ${sectionTitle}. ${first}`.trim()
}

/** Higher-priority radio may interrupt lower-priority speech. Peers wait their turn. */
export function jimmyMayInterrupt(current:JimmyRadioPriority,next:JimmyRadioPriority){
 return priorityRank[next]>priorityRank[current]
}

export const JIMMY_LIFECYCLE={
 paused:'Ride paused. Keep the legs moving gently.',
 complete:'Session complete. Ease the pedals and start recovery.',
} as const


export function jimmyMinimumSpeechGap(priority:JimmyRadioPriority){
 if(priority==='ambient')return 45
 if(priority==='course')return 8
 if(priority==='tactical')return 5
 return 0
}

export function jimmySpeechAllowed(args:{
 lastSpokenAt:number
 now:number
 currentPriority:JimmyRadioPriority
 nextPriority:JimmyRadioPriority
}){
 if(args.lastSpokenAt<0)return true
 if(jimmyMayInterrupt(args.currentPriority,args.nextPriority))return true
 return args.now-args.lastSpokenAt>=jimmyMinimumSpeechGap(args.nextPriority)
}
