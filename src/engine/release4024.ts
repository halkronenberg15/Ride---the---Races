import type { EquipmentInstance } from './manualBike.ts'
import type { LivePrescription } from './terrainModifier.ts'
import type { RideSegment } from '../data/raceStages.ts'

export type FtpProvenance='MEASURED'|'RIDER_ENTERED'|'ESTIMATED'|'INTRO_EFFORT_BASELINE'|'UNKNOWN'
export type CoachingContext='PROFESSIONAL_RACE'|'WORLDS'|'RECOVERY'|'LEG_OPENER'|'INTRO_CYCLING'|'CALIBRATION'|'STAGE_REPLAY'|'OFF_SEASON'
export type PrescriptionSnapshot={authoredId:string;resolvedId:string;name:string;duration:number;zone:string;power:string;cadence:string;resistance:string;reason:'SECTION_BOUNDARY'|'TACTICAL_INPUT_CHANGED'|'RIDER_INPUT_CHANGED'|'RESTORED'}

export function prescriptionSnapshot(index:number,segment:RideSegment,resolved:LivePrescription,reason:PrescriptionSnapshot['reason']='SECTION_BOUNDARY'):PrescriptionSnapshot{
 return {authoredId:`section-${index}-${segment.name}`,resolvedId:`${resolved.prescriptionId}|${resolved.manualTarget.calibrationConfidence}|${resolved.authoritativeGradient}`,name:segment.name,duration:segment.sec,zone:resolved.zone,power:resolved.power,cadence:resolved.cadence,resistance:resolved.resistance.replace(/ · START \d+% @ \d+ rpm| · Start \d+%/i,''),reason}
}

export type NoFtpTarget={power:string;cadence:string;resistance:string;rpe:string;provisional:boolean}
/** No-FTP guidance is equipment-specific and never invents watt precision. */
export function noFtpTarget(segment:RideSegment,equipment:EquipmentInstance):NoFtpTarget{
 const recovery=/recovery|cooldown|easy finish/i.test(`${segment.name} ${segment.type}`),calibration=/calibration/i.test(segment.type)
 const cadence=recovery?'60–75 rpm':calibration?'65–80 rpm':'65–80 rpm'
 const rpe=recovery?'RPE 1–2 / 10':'RPE 2–3 / 10'
 if(equipment.calibrationProfileId==='peloton-bike-manual-reference')return {power:equipment.powerAvailable?'PROVISIONAL — calibrating':'POWER GUIDANCE AFTER CALIBRATION',cadence,resistance:recovery?'20–25%':'25–30%',rpe,provisional:true}
 return {power:equipment.powerAvailable?'PROVISIONAL POWER — follow RPE':'POWER NOT PRESCRIBED',cadence,resistance:equipment.resistanceAvailable?'Light–Moderate load':'Light load',rpe,provisional:true}
}

export function coachingContext(library:string,workoutId?:string,replay=false):CoachingContext{
 if(replay)return 'STAGE_REPLAY';if(library==='worlds-2026')return 'WORLDS';if(library!=='training')return 'PROFESSIONAL_RACE'
 if(workoutId?.startsWith('recovery-'))return 'RECOVERY';if(workoutId?.startsWith('opener-'))return 'LEG_OPENER';if(workoutId==='intro-calibration')return 'CALIBRATION';if(workoutId?.startsWith('intro-'))return 'INTRO_CYCLING';return 'OFF_SEASON'
}
const raceOnly=/\b(sprint|peloton|attack|breakaway|find the group|group position)\b/i
export function normalizeJeanCopy(title:string,copy:string){const clean=copy.trim().replace(/\s+/g,' '),a=title.trim().replace(/[.!?]+$/,'');return clean.toLocaleLowerCase()===a.toLocaleLowerCase()||clean.toLocaleLowerCase()===`${a}. ${a}`.toLocaleLowerCase()?a:clean}
export function cueAllowed(context:CoachingContext,message:string){return ['PROFESSIONAL_RACE','WORLDS','STAGE_REPLAY'].includes(context)||!raceOnly.test(message)}

export type SeasonClosure={status:'ACTIVE'|'ENDED';endedAt:string|null;completionReason:'FINAL_STAGE'|'OWNER_EARLY_END'|null;finalStageCompleted:number;earlyEndOwnerOverride:boolean;finalResultsSnapshot:unknown;handoffStatus:'NOT_STARTED'|'READY_FOR_REVIEW';offSeasonFolderLocked:boolean}
export const activeSeasonClosure=():SeasonClosure=>({status:'ACTIVE',endedAt:null,completionReason:null,finalStageCompleted:0,earlyEndOwnerOverride:false,finalResultsSnapshot:null,handoffStatus:'NOT_STARTED',offSeasonFolderLocked:true})
export function closeSeason(current:SeasonClosure,input:{now:string;finalStageCompleted:number;ownerEarlyEnd:boolean;results:unknown}){if(current.status==='ENDED')return current;return {status:'ENDED' as const,endedAt:input.now,completionReason:input.ownerEarlyEnd?'OWNER_EARLY_END' as const:'FINAL_STAGE' as const,finalStageCompleted:input.finalStageCompleted,earlyEndOwnerOverride:input.ownerEarlyEnd,finalResultsSnapshot:structuredClone(input.results),handoffStatus:'READY_FOR_REVIEW' as const,offSeasonFolderLocked:true}}

export function wakeLockMessage(status:'inactive'|'requesting'|'active'|'unsupported'|'blocked'|'released'){return status==='active'?'Screen will stay awake during your ride':'Disable Auto-Lock to keep the cockpit visible'}
