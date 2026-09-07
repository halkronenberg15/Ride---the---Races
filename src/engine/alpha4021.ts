import type { RideSegment } from '../data/raceStages.ts'
import { resolveManualBikeTarget, type CadencePreferences, type EquipmentInstance, type ManualBikeProfile } from './manualBike.ts'
import type { LivePrescription } from './terrainModifier.ts'

export type TacticalOpportunity={id:string;title:string;prompt:string;action:'ATTACK'|'JOIN_BREAKAWAY'|'CHASE';decline:string;durationSeconds:number;powerDeltaPercent:number;expiresAfterSeconds:number}
export type TacticalEffort={eventId:string;action:TacticalOpportunity['action'];startedAt:number;durationSeconds:number;powerDeltaPercent:number}

export function tacticalOpportunity(segment:Pick<RideSegment,'name'|'type'|'sec'>,isTraining:boolean,isSprintMode:boolean,elapsedInSegment:number):TacticalOpportunity|null{
 if(isTraining||isSprintMode||elapsedInSegment<Math.min(20,segment.sec*.15))return null
 const text=`${segment.name} ${segment.type}`
 if(/climb|ascent|ridge|pressure/i.test(text))return {id:`attack-${segment.name}`,title:'GC ATTACK OPPORTUNITY',prompt:'This is a good place to attack. Let’s open a gap.',action:'ATTACK',decline:'HOLD POSITION',durationSeconds:60,powerDeltaPercent:12,expiresAfterSeconds:25}
 if(/peloton|crosswind/i.test(text))return {id:`break-${segment.name}`,title:'BREAKAWAY FORMING',prompt:'The break is forming. If you have the legs, get across now.',action:'JOIN_BREAKAWAY',decline:'STAY WITH PELOTON',durationSeconds:90,powerDeltaPercent:8,expiresAfterSeconds:25}
 return null
}

export function tacticalPrescription(baseline:LivePrescription,multiplier:number,equipment:EquipmentInstance,profile:ManualBikeProfile|null,preferences?:CadencePreferences):LivePrescription{
 if(multiplier===1)return baseline
 const powerRange={min:Math.round(baseline.powerRange.min*multiplier),max:Math.round(baseline.powerRange.max*multiplier)}
 const manualTarget=resolveManualBikeTarget({powerRange,cadenceRange:baseline.cadenceRange,gradient:baseline.authoritativeGradient,equipment,profile,preferences})
 const resistanceRange=manualTarget.resolvedResistanceRange??baseline.resistanceRange
 return {...baseline,powerRange,power:`${powerRange.min}–${powerRange.max} W`,cadenceRange:manualTarget.resolvedCadenceRange,cadence:`${manualTarget.resolvedCadenceRange.min}–${manualTarget.resolvedCadenceRange.max} rpm`,resistanceRange,resistance:manualTarget.recommendedResistance===null?'UNAVAILABLE':`${resistanceRange.min}–${resistanceRange.max}% · START ${manualTarget.recommendedResistance}% @ ${manualTarget.recommendedCadence} rpm`,manualTarget,manualResistanceTarget:manualTarget.recommendedResistance??0}
}

export function returnMultiplier(fromMultiplier:number,elapsedSeconds:number){return 1+(fromMultiplier-1)*(1-Math.min(1,Math.max(0,elapsedSeconds/45)))}
export function trainingMarkerPositions(segments:Pick<RideSegment,'sec'>[]){const total=segments.reduce((sum,s)=>sum+s.sec,0);let elapsed=0;return [0,...segments.slice(1).map((_,i)=>{elapsed+=segments[i].sec;return total?elapsed/total:0}),1]}
export function raceMarkerPositions(routeKm:number[]){const finish=Math.max(...routeKm,1);return [...routeKm.map(km=>km/finish),1]}
export function shouldDisplayClimb(input:{authoredClassified:boolean;averageGradient:number;elevationGainM:number;distanceKm:number}){return input.authoredClassified||(input.averageGradient>=3&&input.elevationGainM>=30&&input.distanceKm>=.75)}
export function sprintTransitionCountdown(remaining:number){const whole=Math.ceil(remaining);return whole<=5&&whole>=1?whole:null}
