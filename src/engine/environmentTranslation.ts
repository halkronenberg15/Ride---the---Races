export type StageSimulationSignature={
 classification:string
 workload:'LOW'|'MODERATE'|'HIGH'|'VERY_HIGH'
 terrainSequence:Array<'flat'|'rolling'|'climb'|'descent'|'technical'>
 climbCount:number
 decisiveFinale:string
 narrativeWeights:{climbing:number;rolling:number;sprinting:number;tactics:number}
}

export type LocalRouteFeature={
 distanceKm:number
 elevationGainM:number
 climbCount:number
 surface:'paved'|'mixed'|'unknown'
 trafficSignals?:number
 technicalTurns?:number
 hazardousDescents?:number
 daylightSuitable?:boolean
 routable?:boolean
}

export type OutdoorMatchInput={
 stage:StageSimulationSignature
 local:LocalRouteFeature
}

export type OutdoorStageMatch={
 similarity:number
 safetyEligible:boolean
 reasons:string[]
}

/**
 * Environment Translation compares stage character to a local route.
 * It never aliases professional course distance to local GPS distance.
 */
export function scoreOutdoorStageMatch({stage,local}:OutdoorMatchInput):OutdoorStageMatch{
 const safetyEligible=local.routable!==false&&local.surface!=='unknown'&&local.hazardousDescents!==undefined?local.hazardousDescents<3:true
 const reasons:string[]=[]
 if(local.routable===false)reasons.push('Local route is not continuously routable.')
 if(local.surface==='unknown')reasons.push('Surface is not verified.')
 if((local.hazardousDescents??0)>=3)reasons.push('Route has too many hazardous descents for race-fidelity priority.')
 if(local.daylightSuitable===false)reasons.push('Route is not suitable for the planned daylight window.')

 const climbFit=stage.climbCount===0?Math.max(0,1-local.climbCount/4):Math.max(0,1-Math.abs(local.climbCount-stage.climbCount)/Math.max(1,stage.climbCount))
 const elevationExpectation=stage.narrativeWeights.climbing>=.5?1200:stage.narrativeWeights.climbing>=.25?600:250
 const elevationFit=Math.max(0,1-Math.abs(local.elevationGainM-elevationExpectation)/Math.max(500,elevationExpectation))
 const distanceFit=Math.min(1,local.distanceKm/40)
 const signalPenalty=Math.min(.35,(local.trafficSignals??0)*.02)
 const technicalPenalty=Math.min(.25,(local.technicalTurns??0)*.01)

 let similarity=.45*climbFit+.35*elevationFit+.20*distanceFit-signalPenalty-technicalPenalty
 if(!safetyEligible||local.daylightSuitable===false)similarity*=.5
 similarity=Math.max(0,Math.min(1,similarity))

 if(similarity>=.75)reasons.push('Local terrain strongly matches the stage character.')
 else if(similarity>=.5)reasons.push('Local terrain provides a useful partial stage match.')
 else reasons.push('Local terrain only loosely matches the stage character.')

 return {similarity:Number(similarity.toFixed(3)),safetyEligible:local.daylightSuitable===false?false:safetyEligible,reasons}
}

export type EnvironmentPosition={
 professionalCourseKm:number
 professionalCourseProgress:number
 localRouteKm:number|null
 latitude?:number
 longitude?:number
}

/** Keeps the two geographic domains explicit and independent. */
export function environmentPosition(args:EnvironmentPosition):EnvironmentPosition{
 if(args.professionalCourseKm<0)throw new Error('Professional course distance cannot be negative.')
 if(args.professionalCourseProgress<0||args.professionalCourseProgress>1)throw new Error('Professional course progress must stay within 0–1.')
 if(args.localRouteKm!==null&&args.localRouteKm<0)throw new Error('Local route distance cannot be negative.')
 return {...args}
}
