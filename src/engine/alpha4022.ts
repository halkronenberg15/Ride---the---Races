import type { EquipmentInstance } from './manualBike.ts'
import { resolvePreviewTarget } from './previewTargets.ts'

export type RaceAction='JOIN_BREAKAWAY'|'ATTACK'|'CHASE'|'HOLD_POSITION'|'RETURN_TO_PELOTON'
export type RaceSituation={id:string;trigger:number;expiry:number;caption:string;groupState:string;simulatedGap:string;actions:RaceAction[];preview:{powerMultiplier:number;cadence:number;durationSeconds:number};accepted:{powerMultiplier:number;caption:string};decline:'BASE_PRESCRIPTION';resolutionCaption:string;detailRangeId?:string}
const situation=(id:string,trigger:number,expiry:number,caption:string,groupState:string,simulatedGap:string,actions:RaceAction[],multiplier=1.08):RaceSituation=>({id,trigger,expiry,caption,groupState,simulatedGap,actions,preview:{powerMultiplier:multiplier,cadence:92,durationSeconds:Math.round((expiry-trigger)*80*60)},accepted:{powerMultiplier:multiplier,caption:'Tactical prescription active.'},decline:'BASE_PRESCRIPTION',resolutionCaption:'Authored situation resolved. Return to the base prescription.',detailRangeId:actions.includes('CHASE')?`detail-${id}`:undefined})
export const montrealRoadStory:RaceSituation[]=[
 situation('mtl-early-break',.08,.16,'An early breakaway forms on the South Shore.','BREAKAWAY / PELOTON','SIMULATED · 0:35',['JOIN_BREAKAWAY','HOLD_POSITION'],1.06),
 situation('mtl-controlled-gap',.16,.27,'The peloton permits a controlled gap.','BREAKAWAY / PELOTON','SIMULATED · 2:10',['HOLD_POSITION']),
 situation('mtl-approach-chase',.27,.39,'The move is getting dangerous. Close it now.','BREAKAWAY / CHASE / PELOTON','SIMULATED · 1:25',['CHASE','HOLD_POSITION'],1.14),
 situation('mtl-bridge-pressure',.39,.45,'Positioning pressure rises over Samuel-De Champlain Bridge.','REDUCED PELOTON','SIMULATED · 0:48',['HOLD_POSITION'],1.05),
 situation('mtl-circuit-entry',.45,.55,'The breakaway is reduced around circuit entry.','BREAKAWAY / PELOTON','SIMULATED · 0:22',['CHASE','HOLD_POSITION'],1.12),
 situation('mtl-climb-selections',.55,.82,'Camillien-Houde and Polytechnique create repeated selections.','SELECTED PELOTON','SIMULATED · GROUPED',['HOLD_POSITION'],1.08),
 situation('mtl-favorites-attack',.82,.94,'A favorites attack opportunity opens.','FAVORITES / CHASE','SIMULATED · 0:08',['ATTACK','HOLD_POSITION'],1.18),
 situation('mtl-final-position',.94,.99,'Final-lap positioning leads to rising Avenue du Parc.','FRONT GROUP','SIMULATED · GROUPED',['HOLD_POSITION'],1.1),
]
export function activeRaceSituation(raceId:string,progress:number){return raceId==='worlds-2026'?montrealRoadStory.find(event=>progress>=event.trigger&&progress<event.expiry):undefined}
export function mountRoyalLap(distanceKm:number){if(distanceKm<112.9)return null;return Math.min(12,Math.max(1,Math.floor((distanceKm-112.9)/13.4)+1))}
export type ProfileViewState={mode:'OVERVIEW'|'DETAIL';activeRangeId:string|null;autoConsumedIds:string[]}
export function synchronizeProfileView(state:ProfileViewState,event:RaceSituation|undefined,cooldown=false):ProfileViewState{if(cooldown||!event?.detailRangeId)return {...state,mode:'OVERVIEW',activeRangeId:null};if(state.autoConsumedIds.includes(event.id))return state;return {mode:'DETAIL',activeRangeId:event.detailRangeId,autoConsumedIds:[...state.autoConsumedIds,event.id]}}
export function toggleProfileView(state:ProfileViewState){return {...state,mode:state.mode==='DETAIL'?'OVERVIEW':'DETAIL' as const}}
export function returnMultiplier(activeSeconds:number){return activeSeconds>=45?1:1+(1-Math.max(0,activeSeconds)/45)*.15}
export function chasePrescription(basePower:number,equipment:EquipmentInstance,event:RaceSituation){const power=Math.round(basePower*event.preview.powerMultiplier);return resolvePreviewTarget({name:'Contextual Chase',type:'Tactical effort',zone:'Z4',power:`${power} W`,cadence:`${event.preview.cadence} rpm`,resistance:'Resolver-backed',routeKm:0,icon:'',sec:event.preview.durationSeconds,description:'Authored Chase',objective:'Close the authored gap.',secondaryObjective:'Preserve canonical position.',terrainLabel:'Canonical terrain'},power,equipment)}
export function circuitProgressToLap(progress:number){return progress<.41?null:Math.min(12,Math.max(1,Math.floor(((progress-.41)/.56)*12)+1))}

export type GradientBlock={id:string;start:number;end:number;gradient:number}
export function gradientDetail(blocks:GradientBlock[],coordinate:number){const index=Math.max(0,blocks.findIndex(block=>coordinate>=block.start&&coordinate<block.end));const current=blocks[index]??blocks.at(-1)!;return {current,next:blocks[index+1]?.gradient??null,index,position:(coordinate-current.start)/(current.end-current.start),remaining:Math.max(0,current.end-coordinate),direction:current.gradient>.3?'UPHILL':current.gradient<-.3?'DOWNHILL':'FLAT'}}
export function resistanceDirection(previous:{gradient:number;resistance:number;power:number},next:{gradient:number;resistance:number;power:number},reason?:'POWER TARGET'|'TACTICAL EFFORT'|'RECOVERY TARGET'|'CALIBRATION LIMITED'){const unexplained=next.gradient<previous.gradient&&next.power===previous.power&&next.resistance>previous.resistance&&!reason;return {valid:!unexplained,reason:reason??null}}
export const stage7GradientRegression={from:{gradient:3.4,resistance:46,power:190},to:{gradient:1.9,resistance:46,power:190}}
