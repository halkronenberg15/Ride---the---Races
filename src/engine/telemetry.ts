export type NormalizedTelemetry={
 power?:number
 cadence?:number
 resistance?:number
 heartRate?:number
 speed?:number
 timestamp:number
}

export interface DeviceAdapter<DeviceSample>{
 normalize(sample:DeviceSample):NormalizedTelemetry
}

export type PerformanceTarget={
 powerMin?:number
 powerMax?:number
 cadenceMin?:number
 cadenceMax?:number
}

export type RiderPerformance={
 targetCompliance:number|null
 powerCompliance:number|null
 cadenceCompliance:number|null
 fatigue:number
 telemetryTimestamp:number
 stale:boolean
}

const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value))
const rangeCompliance=(value:number|undefined,min:number|undefined,max:number|undefined)=>{
 if(value===undefined||min===undefined||max===undefined)return null
 if(value>=min&&value<=max)return 1
 const span=Math.max(1,max-min)
 return clamp(1-Math.min(Math.abs(value-min),Math.abs(value-max))/span)
}

export function evaluateRiderPerformance(args:{
 telemetry:NormalizedTelemetry
 target?:PerformanceTarget
 now?:number
 priorFatigue?:number
}):RiderPerformance{
 const now=args.now??Date.now()
 const target=args.target??{}
 const powerCompliance=rangeCompliance(args.telemetry.power,target.powerMin,target.powerMax)
 const cadenceCompliance=rangeCompliance(args.telemetry.cadence,target.cadenceMin,target.cadenceMax)
 const available=[powerCompliance,cadenceCompliance].filter((value):value is number=>value!==null)
 const targetCompliance=available.length?available.reduce((sum,value)=>sum+value,0)/available.length:null
 const stale=now-args.telemetry.timestamp>10000
 let fatigue=Math.max(0,Math.min(100,args.priorFatigue??0))
 if(!stale&&targetCompliance!==null){
  fatigue=Math.max(0,Math.min(100,fatigue+(targetCompliance<.65?1.5:targetCompliance>.9?-.35:.25)))
 }
 return {
  targetCompliance:targetCompliance===null?null:Number(targetCompliance.toFixed(3)),
  powerCompliance:powerCompliance===null?null:Number(powerCompliance.toFixed(3)),
  cadenceCompliance:cadenceCompliance===null?null:Number(cadenceCompliance.toFixed(3)),
  fatigue:Number(fatigue.toFixed(2)),
  telemetryTimestamp:args.telemetry.timestamp,
  stale,
 }
}
