export type CalibrationSourceType='historical-average'|'manual-calibration'|'live-telemetry'|'imported-ride'
export type SampleConfidence='LOW'|'MEDIUM'|'HIGH'
export type CalibrationConfidence='BASELINE'|'PERSONALIZED'|'CALIBRATED'
export type CalibrationSample={resistance:number;cadence:number;power:number;sourceType:CalibrationSourceType;confidence:SampleConfidence;durationSeconds?:number;timestamp?:string;aggregate:boolean}
export type ManualBikeProfile={id:string;manufacturer:string;model:string;resistanceScaleMin:number;resistanceScaleMax:number;calibrationMethod:string;calibrationConfidence:CalibrationConfidence;calibrationSamples:CalibrationSample[];roadLoadCurve:Array<{gradient:number;resistance:number}>}
export type CadencePreferences={comfortableFlatCadence?:number;seatedClimbingCadence?:number;safeMinimumCadence?:number;safeMaximumCadence?:number}
export type EquipmentInstance={id:string;name:string;manufacturer:string;modelFamily:string;resistanceControl:'manual'|'controllable';powerAvailable:boolean;cadenceAvailable:boolean;resistanceAvailable:boolean;calibrationProfileId?:string;calibrationConfidence:'UNAVAILABLE'|CalibrationConfidence}
export type TargetFeasibility='EXACT'|'ADJUSTED'|'LIMITED'|'UNAVAILABLE'
export type ManualBikeTarget={targetPowerRange:{min:number;max:number};resolvedCadenceRange:{min:number;max:number};resolvedExactResistance:number|null;preferredRoadResistance:number|null;predictedPowerRange:{min:number;max:number}|null;feasibility:TargetFeasibility;calibrationConfidence:'UNAVAILABLE'|CalibrationConfidence;cadenceAdjusted:boolean;resistanceAdjusted:boolean;adjustmentReason:string}
export type RoadFeelScale={id:'comfortable'|'realistic'|'full-road'|'custom';scale:number}
export type VirtualRoadLoad={canonicalGradient:number;effectiveGradient:number;roadFeelScale:number;rollingLoad:number;aerodynamicLoad:number;modelConfidence:'REFERENCE'}
export type ManualRoadFeelPrescription={bikeProfile:string;calibrationConfidence:CalibrationConfidence;canonicalGradient:number;effectiveGradient:number;manualResistanceTarget:number;calibrationPowerEstimate:number;powerCompatibleResistance:number}

export const PELOTON_MANUAL_PROFILE:ManualBikeProfile={
 id:'peloton-bike-manual-reference',manufacturer:'Peloton',model:'Bike — manual resistance',resistanceScaleMin:0,resistanceScaleMax:100,
 calibrationMethod:'Device-family reference road-load curve with low-confidence aggregate rider anchors',calibrationConfidence:'BASELINE',
 calibrationSamples:[
  {resistance:43,cadence:89,power:163,sourceType:'historical-average',confidence:'LOW',aggregate:true},
  {resistance:44,cadence:87,power:166,sourceType:'historical-average',confidence:'LOW',aggregate:true},
  {resistance:45,cadence:88,power:174,sourceType:'historical-average',confidence:'LOW',aggregate:true},
  {resistance:50,cadence:79,power:181,sourceType:'historical-average',confidence:'LOW',aggregate:true},
 ],
 roadLoadCurve:[{gradient:-15,resistance:20},{gradient:-8,resistance:25},{gradient:-4,resistance:30},{gradient:-1,resistance:36},{gradient:0,resistance:39},{gradient:2,resistance:43},{gradient:4,resistance:47},{gradient:6,resistance:51},{gradient:9,resistance:57},{gradient:12,resistance:63},{gradient:15,resistance:69},{gradient:20,resistance:78}],
}
export const PELOTON_BASELINE_EQUIPMENT:EquipmentInstance={id:'peloton-baseline-bike',name:'Peloton manual bike',manufacturer:'Peloton',modelFamily:'Bike',resistanceControl:'manual',powerAvailable:true,cadenceAvailable:true,resistanceAvailable:true,calibrationProfileId:PELOTON_MANUAL_PROFILE.id,calibrationConfidence:'BASELINE'}
export const GENERIC_MANUAL_EQUIPMENT:EquipmentInstance={id:'generic-manual-bike',name:'Manual bike',manufacturer:'Other',modelFamily:'Uncalibrated',resistanceControl:'manual',powerAvailable:false,cadenceAvailable:true,resistanceAvailable:true,calibrationConfidence:'UNAVAILABLE'}
export const SMART_EQUIPMENT_FOUNDATION:EquipmentInstance={id:'smart-equipment',name:'Smart equipment',manufacturer:'Other',modelFamily:'Controllable foundation',resistanceControl:'controllable',powerAvailable:true,cadenceAvailable:true,resistanceAvailable:false,calibrationConfidence:'UNAVAILABLE'}
export function bikeProfileForEquipment(equipment:EquipmentInstance){return equipment.calibrationProfileId===PELOTON_MANUAL_PROFILE.id?PELOTON_MANUAL_PROFILE:null}
export const FULL_ROAD:RoadFeelScale={id:'full-road',scale:1}
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value))
const interpolate=(curve:ManualBikeProfile['roadLoadCurve'],gradient:number)=>{const sorted=[...curve].sort((a,b)=>a.gradient-b.gradient);if(gradient<=sorted[0].gradient)return sorted[0].resistance;if(gradient>=sorted.at(-1)!.gradient)return sorted.at(-1)!.resistance;const right=sorted.find(point=>point.gradient>=gradient)!;const left=sorted[sorted.indexOf(right)-1];return left.resistance+(right.resistance-left.resistance)*(gradient-left.gradient)/(right.gradient-left.gradient)}

/** Reference virtual load, not laboratory physics. Gradient remains canonical while road feel scales only felt load. */
export function resolveVirtualRoadLoad(canonicalGradient:number,roadFeel:RoadFeelScale=FULL_ROAD):VirtualRoadLoad{return {canonicalGradient,effectiveGradient:canonicalGradient*clamp(roadFeel.scale,0,1.25),roadFeelScale:clamp(roadFeel.scale,0,1.25),rollingLoad:1,aerodynamicLoad:0,modelConfidence:'REFERENCE'}}
/** Aggregate anchors approximate the local device response; they are never promoted to synchronized calibration. */
export function estimateBikePower(profile:ManualBikeProfile,resistance:number,cadence:number){const samples=profile.calibrationSamples;let weight=0,total=0;for(const sample of samples){const distance=Math.abs(sample.resistance-resistance)+Math.abs(sample.cadence-cadence)/4;const w=1/(1+distance);total+=w*sample.power*(cadence/sample.cadence)*Math.pow(Math.max(1,resistance)/sample.resistance,1.35);weight+=w}return weight?total/weight:0}
export function inverseResistanceForPower(profile:ManualBikeProfile,targetPower:number,targetCadence:number){let best=profile.resistanceScaleMin,bestError=Infinity;for(let resistance=profile.resistanceScaleMin;resistance<=profile.resistanceScaleMax;resistance++){const error=Math.abs(estimateBikePower(profile,resistance,targetCadence)-targetPower);if(error<bestError){best=resistance;bestError=error}}return best}
/** Road load owns the knob target. Power inversion is diagnostic and informs cadence, never terrain. */
export function translateManualRoadFeel(profile:ManualBikeProfile,load:VirtualRoadLoad,targetPower:number,targetCadence:number):ManualRoadFeelPrescription{const manualResistanceTarget=Math.round(clamp(interpolate(profile.roadLoadCurve,load.effectiveGradient),profile.resistanceScaleMin,profile.resistanceScaleMax));return {bikeProfile:profile.id,calibrationConfidence:profile.calibrationConfidence,canonicalGradient:load.canonicalGradient,effectiveGradient:load.effectiveGradient,manualResistanceTarget,calibrationPowerEstimate:Math.round(estimateBikePower(profile,manualResistanceTarget,targetCadence)),powerCompatibleResistance:inverseResistanceForPower(profile,targetPower,targetCadence)}}

/** Reconciles physiology, terrain and device response in safety-first order. */
export function resolveManualBikeTarget(input:{powerRange:{min:number;max:number};cadenceRange:{min:number;max:number};gradient:number;equipment:EquipmentInstance;profile:ManualBikeProfile|null;preferences?:CadencePreferences}):ManualBikeTarget{
 const safeMin=input.preferences?.safeMinimumCadence??60,safeMax=input.preferences?.safeMaximumCadence??120
 const preferredCadence=input.gradient>2?input.preferences?.seatedClimbingCadence:input.preferences?.comfortableFlatCadence
 const width=input.cadenceRange.max-input.cadenceRange.min
 const proposed=preferredCadence===undefined?input.cadenceRange:{min:preferredCadence-width/2,max:preferredCadence+width/2}
 const cadence={min:Math.round(clamp(proposed.min,safeMin,safeMax)),max:Math.round(clamp(proposed.max,safeMin,safeMax))};if(cadence.max<cadence.min)cadence.max=cadence.min
 const cadenceAdjusted=cadence.min!==input.cadenceRange.min||cadence.max!==input.cadenceRange.max
 if(!input.profile)return {targetPowerRange:input.powerRange,resolvedCadenceRange:cadence,resolvedExactResistance:null,preferredRoadResistance:null,predictedPowerRange:null,feasibility:'UNAVAILABLE',calibrationConfidence:input.equipment.calibrationConfidence,cadenceAdjusted,resistanceAdjusted:false,adjustmentReason:'No compatible device calibration; resistance guidance unavailable.'}
 const preferred=Math.round(clamp(interpolate(input.profile.roadLoadCurve,input.gradient),input.profile.resistanceScaleMin,input.profile.resistanceScaleMax))
 const predicted=(resistance:number)=>({min:Math.round(estimateBikePower(input.profile!,resistance,cadence.min)),max:Math.round(estimateBikePower(input.profile!,resistance,cadence.max))})
 let resistance=preferred,power=predicted(resistance)
 const overlaps=()=>power.max>=input.powerRange.min&&power.min<=input.powerRange.max
 if(overlaps())return {targetPowerRange:input.powerRange,resolvedCadenceRange:cadence,resolvedExactResistance:resistance,preferredRoadResistance:preferred,predictedPowerRange:power,feasibility:cadenceAdjusted?'ADJUSTED':'EXACT',calibrationConfidence:input.profile.calibrationConfidence,cadenceAdjusted,resistanceAdjusted:false,adjustmentReason:cadenceAdjusted?'Cadence preference applied within safe limits.':'Preferred road setting overlaps the physiological target.'}
 const midpoint=(input.powerRange.min+input.powerRange.max)/2
 resistance=inverseResistanceForPower(input.profile,midpoint,(cadence.min+cadence.max)/2);power=predicted(resistance)
 const feasible=overlaps()
 return {targetPowerRange:input.powerRange,resolvedCadenceRange:cadence,resolvedExactResistance:resistance,preferredRoadResistance:preferred,predictedPowerRange:power,feasibility:feasible?'ADJUSTED':'LIMITED',calibrationConfidence:input.profile.calibrationConfidence,cadenceAdjusted,resistanceAdjusted:resistance!==preferred,adjustmentReason:feasible?'Cadence and resistance reconciled with the physiological power objective.':'Safe calibrated limits cannot fully overlap the power objective.'}
}

export type StableTelemetryWindow={samples:Array<{resistance:number;cadence:number;power:number;timestamp:number}>;minimumDurationSeconds:number;maximumVariation:{resistance:number;cadence:number;power:number}}
export function calibrationSampleFromStableWindow(window:StableTelemetryWindow):CalibrationSample|null{if(window.samples.length<2)return null;const duration=(window.samples.at(-1)!.timestamp-window.samples[0].timestamp)/1000;const values=(key:'resistance'|'cadence'|'power')=>window.samples.map(sample=>sample[key]);const stable=(key:'resistance'|'cadence'|'power',limit:number)=>Math.max(...values(key))-Math.min(...values(key))<=limit;if(duration<window.minimumDurationSeconds||!stable('resistance',window.maximumVariation.resistance)||!stable('cadence',window.maximumVariation.cadence)||!stable('power',window.maximumVariation.power))return null;const average=(key:'resistance'|'cadence'|'power')=>values(key).reduce((sum,value)=>sum+value,0)/values(key).length;return {resistance:average('resistance'),cadence:average('cadence'),power:average('power'),sourceType:'live-telemetry',confidence:'HIGH',durationSeconds:duration,timestamp:new Date(window.samples.at(-1)!.timestamp).toISOString(),aggregate:false}}

/** Future Jean calls may use this deterministic threshold/cooldown gate; 4.0.18 keeps guidance visual. */
export class ManualResistanceAnnouncementGate{private lastTarget:number|null=null;private lastAt=-Infinity;private readonly minimumChange:number;private readonly cooldownSeconds:number;constructor(minimumChange=4,cooldownSeconds=45){this.minimumChange=minimumChange;this.cooldownSeconds=cooldownSeconds}shouldAnnounce(target:number,elapsedSeconds:number){const useful=this.lastTarget===null||Math.abs(target-this.lastTarget)>=this.minimumChange;const ready=elapsedSeconds-this.lastAt>=this.cooldownSeconds;if(!useful||!ready)return false;this.lastTarget=target;this.lastAt=elapsedSeconds;return true}reset(){this.lastTarget=null;this.lastAt=-Infinity}}
