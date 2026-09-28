import * as Crypto from 'expo-crypto'
import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'
import { supabase } from './supabase'

type LegacyRide={
  id:string
  date:string
  source?:string
  durationMinutes?:number
  distanceKm?:number
  averagePower?:number
  averageHeartRate?:number
  averageCadence?:number
  totalOutputKj?:number
  calories?:number
  elevationM?:number
  workoutId?:string
  offSeasonAssignmentId?:string
  race?:string
  stageNumber?:number
  notes?:string
  ftp?:number
}

type LegacyCareerExport={
  format:'ride-the-races-career-export'
  formatVersion:number
  exportedAt:string
  sourceApplicationVersion:string
  sourceSchemaVersion:number
  career:{
    rider:{
      name:string
      ftp:number|null
      weightKg?:number
    }
    settings?:{measurementSystem?:'imperial'|'metric'}
    trainingHistory?:unknown[]
    rideHistory:LegacyRide[]
  }
}

export type LegacyImportPreview={
  fileName:string
  riderName:string
  ftp:number|null
  weightKg:number|null
  units:'imperial'|'metric'
  rideCount:number
  trainingCount:number
  sourceApplicationVersion:string
  sourceSchemaVersion:number
  exportedAt:string
  raw:LegacyCareerExport
}

function asExport(value:unknown):LegacyCareerExport{
  if(!value||typeof value!=='object')throw new Error('This file is not valid RtR career data.')
  const raw=value as Partial<LegacyCareerExport>
  if(raw.format!=='ride-the-races-career-export')throw new Error('Choose a file created by "Export My RtR Career".')
  if(raw.formatVersion!==1)throw new Error('This RtR export format is not supported yet.')
  if(!raw.career||!raw.career.rider||!Array.isArray(raw.career.rideHistory))throw new Error('The RtR export is missing rider or ride-history data.')
  if(typeof raw.career.rider.name!=='string')throw new Error('The exported rider name is invalid.')
  return raw as LegacyCareerExport
}

export async function pickLegacyCareer():Promise<LegacyImportPreview|null>{
  const result=await DocumentPicker.getDocumentAsync({
    type:['application/json','text/json','text/plain'],
    copyToCacheDirectory:true,
    multiple:false,
  })
  if(result.canceled)return null
  const asset=result.assets[0]
  const text=await new File(asset.uri).text()
  const raw=asExport(JSON.parse(text))
  return {
    fileName:asset.name,
    riderName:raw.career.rider.name,
    ftp:typeof raw.career.rider.ftp==='number'?raw.career.rider.ftp:null,
    weightKg:typeof raw.career.rider.weightKg==='number'?raw.career.rider.weightKg:null,
    units:raw.career.settings?.measurementSystem==='metric'?'metric':'imperial',
    rideCount:raw.career.rideHistory.length,
    trainingCount:Array.isArray(raw.career.trainingHistory)?raw.career.trainingHistory.length:0,
    sourceApplicationVersion:raw.sourceApplicationVersion,
    sourceSchemaVersion:raw.sourceSchemaVersion,
    exportedAt:raw.exportedAt,
    raw,
  }
}

function sourceName(source?:string){
  const allowed=new Set(['RTR','GARMIN','PELOTON','STRAVA','WAHOO','ZWIFT','APPLE_HEALTH','MANUAL'])
  const normalized=(source??'MANUAL').toUpperCase().replace(' ','_')
  return allowed.has(normalized)?normalized:'MANUAL'
}

function rideTimes(ride:LegacyRide){
  const durationSeconds=Math.max(0,Math.round((ride.durationMinutes??0)*60))
  const parsed=Date.parse(ride.date)
  const startedAt=Number.isFinite(parsed)?new Date(parsed):new Date()
  const completedAt=new Date(startedAt.getTime()+durationSeconds*1000)
  return {durationSeconds,startedAt:startedAt.toISOString(),completedAt:completedAt.toISOString()}
}

export async function commitLegacyCareerImport(preview:LegacyImportPreview,athleteId:string){
  const {raw}=preview
  const {error:archiveError}=await supabase.from('legacy_profile_imports').insert({
    athlete_id:athleteId,
    source_schema_version:preview.sourceSchemaVersion,
    source_app_version:preview.sourceApplicationVersion,
    ride_count:preview.rideCount,
    training_count:preview.trainingCount,
    raw_profile:raw,
  })
  if(archiveError)throw new Error('Could not archive the source RtR profile: '+archiveError.message)

  const {error:profileError}=await supabase.from('athlete_profiles').update({
    display_name:preview.riderName,
    ftp_watts:preview.ftp,
    weight_kg:preview.weightKg,
    preferred_units:preview.units,
    profile_version:2,
    updated_at:new Date().toISOString(),
  }).eq('athlete_id',athleteId)
  if(profileError)throw new Error('Could not update the cloud rider profile: '+profileError.message)

  let imported=0
  for(const ride of raw.career.rideHistory){
    if(!ride||typeof ride.id!=='string'||!ride.id)continue
    const {durationSeconds,startedAt,completedAt}=rideTimes(ride)
    const row={
      ride_id:Crypto.randomUUID(),
      athlete_id:athleteId,
      legacy_source_id:ride.id,
      legacy_source_payload:ride,
      source:sourceName(ride.source),
      started_at:startedAt,
      completed_at:completedAt,
      duration_seconds:durationSeconds,
      distance_meters:typeof ride.distanceKm==='number'?Math.round(ride.distanceKm*1000):null,
      elevation_meters:ride.elevationM??null,
      average_power_watts:ride.averagePower??null,
      average_heart_rate_bpm:ride.averageHeartRate??null,
      average_cadence_rpm:ride.averageCadence??null,
      energy_kj:ride.totalOutputKj??null,
      calories:ride.calories??null,
      ftp_watts:ride.ftp??preview.ftp,
      workout_id:ride.workoutId??null,
      assignment_id:ride.offSeasonAssignmentId??null,
      race_id:ride.race??null,
      stage_number:ride.stageNumber??null,
      notes:ride.notes??null,
      record_version:1,
    }
    const {error}=await supabase.from('rides').upsert(row,{onConflict:'athlete_id,legacy_source_id',ignoreDuplicates:true})
    if(error)throw new Error('Ride history import stopped: '+error.message)
    imported+=1
  }
  return {imported,archived:true}
}
