import { elapsedFromClock, pauseClock, resumeClock, type PersistedRideClock } from './activeRideClock.ts'
import { fourWeekPreview, hydrateAdaptive, recordZoneEvidence } from './adaptiveTraining40251.ts'
import type { Alpha4025State, OutdoorActivity } from './alpha4025.ts'

export const HAL_SATURDAY_ASSIGNMENT_ID='w1-d6'
export const HAL_SATURDAY_DATE='2026-09-26'
export const OUTDOOR_ACTIVITY_ID=`outdoor:${HAL_SATURDAY_ASSIGNMENT_ID}`
export type ActiveOutdoorRide=PersistedRideClock&{id:string;assignmentId:string;startedAt:string;completionRequested?:'FULL'|'EARLY'}
export type OutdoorMeasurements={durationSeconds?:number;distanceMiles?:number;rpe?:number;averageHeartRate?:number;maximumHeartRate?:number;averageCadenceRpm?:number;averagePowerWatts?:number;notes?:string}
export type OutdoorWorkoutSection={id:'warm-up'|'aerobic-endurance'|'cooldown';title:'Warm-up'|'Aerobic Endurance'|'Cooldown';durationSeconds:number;rpe:string;effort:string;guidance:string}
export const OUTDOOR_ENDURANCE_90_SECTIONS:OutdoorWorkoutSection[]=[
 {id:'warm-up',title:'Warm-up',durationSeconds:600,rpe:'RPE 2–3/10',effort:'Easy',guidance:'Gradually settle into a comfortable cadence and relaxed breathing.'},
 {id:'aerobic-endurance',title:'Aerobic Endurance',durationSeconds:4200,rpe:'RPE 3–4/10',effort:'Conversational',guidance:'Steady aerobic riding. No threshold efforts or hard climbing following Friday’s FTP test.'},
 {id:'cooldown',title:'Cooldown',durationSeconds:600,rpe:'RPE 2–3/10',effort:'Progressively easier',guidance:'Reduce effort gradually and finish with relaxed spinning.'},
]
export const OUTDOOR_ENDURANCE_90_SECONDS=OUTDOOR_ENDURANCE_90_SECTIONS.reduce((sum,section)=>sum+section.durationSeconds,0)
export function outdoorWorkoutSnapshot(elapsedSeconds:number){let start=0;for(let index=0;index<OUTDOOR_ENDURANCE_90_SECTIONS.length;index++){const section=OUTDOOR_ENDURANCE_90_SECTIONS[index],end=start+section.durationSeconds;if(elapsedSeconds<end||index===OUTDOOR_ENDURANCE_90_SECTIONS.length-1)return {current:section,upNext:OUTDOOR_ENDURANCE_90_SECTIONS[index+1]??null,currentRemaining:Math.max(0,end-elapsedSeconds),totalRemaining:Math.max(0,OUTDOOR_ENDURANCE_90_SECONDS-elapsedSeconds),complete:elapsedSeconds>=OUTDOOR_ENDURANCE_90_SECONDS};start=end}throw new Error('Outdoor workout has no sections.')}

export const outdoorRideStorageKey=(accountId:string)=>`ride-the-races-active-outdoor-v1:${accountId}`
export function startOutdoorRide(assignmentId:string,now:number):ActiveOutdoorRide{const startedAt=new Date(now).toISOString();return {id:`outdoor-session:${assignmentId}:${startedAt}`,assignmentId,startedAt,accumulatedSeconds:0,runningSince:now,paused:false}}
export function pauseOutdoorRide(ride:ActiveOutdoorRide,now:number):ActiveOutdoorRide{return {...ride,...pauseClock(ride,now)}}
export function resumeOutdoorRide(ride:ActiveOutdoorRide,now:number):ActiveOutdoorRide{return {...ride,...resumeClock(ride,now)}}
export function outdoorElapsed(ride:ActiveOutdoorRide,now:number){return Math.round(elapsedFromClock(ride,now))}

/** Completes the original calendar row and records one manual activity without inferred telemetry. */
export function completeOutdoorRide(state:Alpha4025State,ride:ActiveOutdoorRide,measurements:OutdoorMeasurements,completedAt:string,endedEarly=false):Alpha4025State{
 if(state.outdoorActivities.some(activity=>activity.id===OUTDOOR_ACTIVITY_ID))return state
 const plan=state.trainingPlan,assignment=plan?.weeks.flatMap(week=>week.assignments).find(item=>item.id===ride.assignmentId)
 if(!plan||!assignment||assignment.id!==HAL_SATURDAY_ASSIGNMENT_ID||assignment.date!==HAL_SATURDAY_DATE)throw new Error('Outdoor completion must update the authoritative Saturday assignment.')
 const durationSeconds=Math.max(0,Math.round(measurements.durationSeconds??elapsedFromClock(ride,Date.parse(completedAt))))
 const measured=<T extends number>(value:T|undefined)=>Number.isFinite(value)&&value!>=0?value:undefined
 const activity:OutdoorActivity={id:OUTDOOR_ACTIVITY_ID,assignmentId:assignment.id,date:assignment.date,source:'RtR manual outdoor completion',activity:'Outdoor cycling',durationSeconds,...(measured(measurements.distanceMiles)!==undefined?{distanceMiles:measurements.distanceMiles}:{}),...(measured(measurements.rpe)!==undefined?{rpe:measurements.rpe}:{}),...(measured(measurements.averageHeartRate)!==undefined?{averageHeartRate:measurements.averageHeartRate}:{}),...(measured(measurements.maximumHeartRate)!==undefined?{maximumHeartRate:measurements.maximumHeartRate}:{}),...(measured(measurements.averageCadenceRpm)!==undefined?{averageCadenceRpm:measurements.averageCadenceRpm}:{}),...(measured(measurements.averagePowerWatts)!==undefined?{averagePowerWatts:measurements.averagePowerWatts}:{}),...(measurements.notes?.trim()?{notes:measurements.notes.trim()}:{}),interpretation:['Aerobic outdoor endurance completion','Only rider-entered measurements are recorded','No GPS, speed, elevation, power or sensor data inferred']}
 const status=endedEarly||durationSeconds<assignment.durationMinutes*60?'PARTIAL' as const:'COMPLETED' as const
 const updatedPlan={...plan,weeks:plan.weeks.map(week=>({...week,assignments:week.assignments.map(item=>item.id===assignment.id?{...item,status,completion:{completedAt,durationMinutes:Math.round(durationSeconds/60),notes:endedEarly?'Ended safely before the scheduled duration.':'Outdoor endurance recorded from elapsed session time.'},...(status==='PARTIAL'?{substitution:{kind:'SHORTEN' as const,reason:'Ride ended safely before the planned duration; original assignment preserved.'}}:{})}:item)}))}
 const adaptive=hydrateAdaptive(state),zoneDevelopment=recordZoneEvidence(adaptive.zoneDevelopment,assignment.workoutId!,assignment.date,status==='COMPLETED'?'SUCCESS':'INCOMPLETE','RtR outdoor completion; elapsed time and rider-entered measurements only')
 return {...state,trainingPlan:updatedPlan,outdoorActivities:[...state.outdoorActivities,activity],adaptive:{...adaptive,zoneDevelopment,fourWeekPreview:fourWeekPreview(updatedPlan)}}
}
