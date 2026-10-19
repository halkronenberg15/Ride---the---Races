import type { CareerState } from '../types/career.ts'
import { careerRevision, type CareerLocalMetadata } from './careerRevision.ts'
import type { CloudCareerSnapshot } from './supabaseCloudCareerReader.ts'

export type CareerReconciliationState='MATCHED'|'LOCAL_NEWER'|'CLOUD_NEWER'|'DIVERGED'

export type CareerReconciliation={
 state:CareerReconciliationState
 localRevision:string
 cloudRevision:string
 localSavedAt:string|null
 cloudSavedAt:string
 message:string
}

export function reconcileCareerVersions(local:CareerState,localMetadata:CareerLocalMetadata|null,cloud:CloudCareerSnapshot):CareerReconciliation{
 const localRevision=localMetadata?.revision??careerRevision(local)
 const cloudRevision=cloud.clientRevision??careerRevision(cloud.career)
 const localSavedAt=localMetadata?.savedAt??null
 const cloudSavedAt=cloud.clientSavedAt??cloud.updatedAt

 if(localRevision===cloudRevision){
  return {state:'MATCHED',localRevision,cloudRevision,localSavedAt,cloudSavedAt,message:'Local and cloud careers match.'}
 }

 if(!localSavedAt){
  return {state:'DIVERGED',localRevision,cloudRevision,localSavedAt,cloudSavedAt,message:'Local and cloud careers differ, but this device has no local revision timestamp yet.'}
 }

 const localTime=Date.parse(localSavedAt),cloudTime=Date.parse(cloudSavedAt)
 if(!Number.isFinite(localTime)||!Number.isFinite(cloudTime)||Math.abs(localTime-cloudTime)<2000){
  return {state:'DIVERGED',localRevision,cloudRevision,localSavedAt,cloudSavedAt,message:'Local and cloud careers differ without a clear newer copy.'}
 }

 if(localTime>cloudTime){
  return {state:'LOCAL_NEWER',localRevision,cloudRevision,localSavedAt,cloudSavedAt,message:'This device has a newer local career than the cloud copy.'}
 }
 return {state:'CLOUD_NEWER',localRevision,cloudRevision,localSavedAt,cloudSavedAt,message:'The cloud career is newer than this device.'}
}
