import type { EquipmentInstance } from './manualBike.ts'
import type { LivePrescription } from './terrainModifier.ts'
import type { RideSegment } from '../data/raceStages.ts'
import type { EditableRideResult, RideMetricEntry } from '../types/career.ts'

export type FtpProvenance='MEASURED'|'RIDER_ENTERED'|'ESTIMATED'|'INTRO_EFFORT_BASELINE'|'UNKNOWN'
export type CoachingContext='PROFESSIONAL_RACE'|'WORLDS'|'RECOVERY'|'LEG_OPENER'|'INTRO_CYCLING'|'CALIBRATION'|'STAGE_REPLAY'|'OFF_SEASON'
export const PRESCRIPTION_RULE_VERSION='alpha4024.2'
export type PrescriptionSnapshot={authoredId:string;resolvedId:string;name:string;duration:number;zone:string;power:string;cadence:string;resistance:string;reason:'SECTION_BOUNDARY'|'TACTICAL_INPUT_CHANGED'|'RIDER_INPUT_CHANGED'|'RESTORED'}
export type OriginalTargetSnapshot=PrescriptionSnapshot&{effort?:string;sectionIndex:number;equipmentId:string;equipmentMode:string;calibrationConfidence:string;ftp:number|null;ftpProvenance:FtpProvenance;tacticalModifier:number;ruleVersion:string}

export function prescriptionSnapshot(index:number,segment:RideSegment,resolved:LivePrescription,reason:PrescriptionSnapshot['reason']='SECTION_BOUNDARY'):PrescriptionSnapshot{
 return {authoredId:`section-${index}-${segment.name}`,resolvedId:`${resolved.prescriptionId}|${resolved.manualTarget.calibrationConfidence}|${resolved.authoritativeGradient}`,name:segment.name,duration:segment.sec,zone:resolved.zone,power:resolved.power,cadence:resolved.cadence,resistance:resolved.resistance.replace(/ · START \d+% @ \d+ rpm| · Start \d+%/i,''),reason}
}

export type IntroEffortBaseline={rpe:number;cadence:number;load:string;completedSteps:number;recordedAt:string;ruleVersion:string}
export type NoFtpTarget={power:string;cadence:string;resistance:string;rpe:string;provisional:boolean;ruleVersion:string;adjustmentReason:string;readyForNextRide:boolean}
export type NoFtpPresentation={mode:'EFFORT';heading:'EFFORT';effort:string;cadence:string;resistance:string;zone:string;sectionId:string;ruleVersion:string}
/** No-FTP guidance is equipment-specific and never invents watt precision. */
export function noFtpTarget(segment:RideSegment,equipment:EquipmentInstance,baseline?:IntroEffortBaseline):NoFtpTarget{
 const recovery=/recovery|cooldown|easy finish/i.test(`${segment.name} ${segment.type}`),calibration=/calibration/i.test(segment.type)
 const complete=Boolean(baseline&&baseline.completedSteps>=2),high=complete&&baseline!.rpe>=7,low=complete&&baseline!.rpe<=3
 const cadence=recovery?'60–75 rpm':high?'60–72 rpm':low?'68–82 rpm':calibration?'65–80 rpm':'65–80 rpm'
 const authoredRpe=segment.zone.match(/RPE(?: CHECK|\s+\d+(?:–\d+)?)/i)?.[0].toUpperCase()
 const rpe=authoredRpe?(authoredRpe==='RPE CHECK'?authoredRpe:`${authoredRpe} / 10`):recovery?'RPE 1–2 / 10':high?'RPE 2 / 10':low?'RPE 3–4 / 10':'RPE 2–3 / 10'
 const adjustmentReason=!complete?'No complete Intro Effort Baseline; conservative defaults retained.':high?'High checkpoint RPE; cadence and load held equal or easier.':low?'Controlled steps completed at low RPE; one small bounded progression applied.':'Appropriate checkpoint RPE; foundation targets retained.'
 const shared={rpe,provisional:true,ruleVersion:PRESCRIPTION_RULE_VERSION,adjustmentReason,readyForNextRide:complete&&!high}
 if(equipment.calibrationProfileId==='peloton-bike-manual-reference')return {...shared,power:equipment.powerAvailable?'PROVISIONAL — calibrating':'POWER GUIDANCE AFTER CALIBRATION',cadence,resistance:recovery?'20–25%':high?'23–28%':low?'27–32%':'25–30%'}
 return {...shared,power:equipment.powerAvailable?'PROVISIONAL POWER — follow RPE':'POWER NOT PRESCRIBED',cadence,resistance:equipment.resistanceAvailable?(high?'Light load':low?'Moderate load':'Light–Moderate load'):'Light load'}
}
export function noFtpPresentation(segment:RideSegment,equipment:EquipmentInstance,baseline?:IntroEffortBaseline,index=0):NoFtpPresentation{const target=noFtpTarget(segment,equipment,baseline);return {mode:'EFFORT',heading:'EFFORT',effort:target.rpe.replace(' / 10',''),cadence:target.cadence,resistance:target.resistance,zone:segment.zone,sectionId:`section-${index}-${segment.name}`,ruleVersion:target.ruleVersion}}

export function rideOpeningMessage(context:CoachingContext,title:string){if(context==='CALIBRATION')return 'Settle in. Smooth pedals—today we’re finding your comfortable baseline.';if(context==='INTRO_CYCLING')return `${title}. Start easy and follow each skill one step at a time.`;if(context==='RECOVERY')return `${title}. Keep the pressure light and breathing calm.`;if(context==='LEG_OPENER')return `${title}. Easy riding first; the short pickups stay controlled.`;return ''}

export function originalTargetsAvailable(value:{targetSnapshots?:OriginalTargetSnapshot[]}){return Boolean(value.targetSnapshots?.length&&value.targetSnapshots.every((snapshot,index)=>snapshot.sectionIndex===index&&snapshot.ruleVersion&&snapshot.authoredId))}
export function validateRideCorrections(patch:Partial<EditableRideResult>){const bounded=(value:number|undefined,min:number,max:number)=>value===undefined||(Number.isFinite(value)&&value>=min&&value<=max);return bounded(patch.durationMinutes,1,1440)&&bounded(patch.totalOutputKj,0,10000)&&bounded(patch.averagePower,0,2500)&&bounded(patch.peakPower,0,3000)&&bounded(patch.averageCadence,20,200)&&bounded(patch.averageResistance,0,100)&&bounded(patch.averageHeartRate,30,250)&&bounded(patch.maximumHeartRate,30,250)&&bounded(patch.distanceKm,0,1000)&&bounded(patch.calories,0,20000)&&bounded(patch.striveScore,0,1000)&&bounded(patch.rpe,1,10)&&!(patch.averagePower!==undefined&&patch.peakPower!==undefined&&patch.peakPower<patch.averagePower)&&!(patch.averageHeartRate!==undefined&&patch.maximumHeartRate!==undefined&&patch.maximumHeartRate<patch.averageHeartRate)}
export function applyRideCorrection(ride:RideMetricEntry,patch:Partial<EditableRideResult>,updatedAt:string):RideMetricEntry{if(!validateRideCorrections(patch))throw new Error('Ride correction is outside the accepted range.');const original=ride.originalUserEntry??{durationMinutes:ride.durationMinutes,actualEngineDurationSeconds:ride.actualEngineDurationSeconds,totalOutputKj:ride.totalOutputKj,averagePower:ride.averagePower,peakPower:ride.peakPower,averageCadence:ride.averageCadence,averageResistance:ride.averageResistance,averageHeartRate:ride.averageHeartRate,maximumHeartRate:ride.maximumHeartRate,distanceKm:ride.distanceKm,calories:ride.calories,striveScore:ride.striveScore,rpe:ride.rpe,notes:ride.notes,equipmentId:ride.equipmentId};return {...ride,originalUserEntry:structuredClone(original),correctedEntry:{...ride.correctedEntry,...patch},updatedAt}}

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
