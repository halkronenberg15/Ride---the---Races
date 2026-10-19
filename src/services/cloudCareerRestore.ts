import type { CareerState } from '../types/career.ts'
import packageMetadata from '../../package.json'
import { migrateCareer } from '../state/careerPersistence.ts'
import { markProfileAppVersion, snapshotBeforeManualRestore, validateRestoredCareer } from './profileBackups.ts'
import type { CloudCareerSnapshot } from './supabaseCloudCareerReader.ts'

export type CloudRestorePreview={
 cloudUpdatedAt:string
 identityDiffers:boolean
 local:{
  riderName:string
  riderNumber:number
  rides:number
  training:number
  nutrition:number
  schemaVersion:number
 }
 cloud:{
  riderName:string
  riderNumber:number
  rides:number
  training:number
  nutrition:number
  schemaVersion:number
 }
}

export function buildCloudRestorePreview(local:CareerState,cloud:CloudCareerSnapshot):CloudRestorePreview{
 const restored=validateRestoredCareer(migrateCareer(cloud.career))
 return {
  cloudUpdatedAt:cloud.updatedAt,
  identityDiffers:local.rider.name.trim().toLowerCase()!==restored.rider.name.trim().toLowerCase()||local.rider.number!==restored.rider.number,
  local:{
   riderName:local.rider.name,
   riderNumber:local.rider.number,
   rides:local.rideHistory.length,
   training:local.trainingHistory.length,
   nutrition:local.nutrition.entries.length,
   schemaVersion:local.schemaVersion,
  },
  cloud:{
   riderName:restored.rider.name,
   riderNumber:restored.rider.number,
   rides:restored.rideHistory.length,
   training:restored.trainingHistory.length,
   nutrition:restored.nutrition.entries.length,
   schemaVersion:restored.schemaVersion,
  },
 }
}

export function commitCloudCareerRestore(args:{
 storage:Pick<Storage,'getItem'|'setItem'>
 storageKey:string
 localCareer:CareerState
 cloud:CloudCareerSnapshot
 confirmed:boolean
 appVersion?:string
}):CareerState{
 if(!args.confirmed)throw new Error('Cloud restore requires explicit confirmation.')
 const restored=validateRestoredCareer(migrateCareer(args.cloud.career))
 const currentRaw=JSON.stringify(args.localCareer)
 const appVersion=args.appVersion??packageMetadata.version
 snapshotBeforeManualRestore(args.storage,args.storageKey,currentRaw,appVersion)
 args.storage.setItem(args.storageKey,JSON.stringify(restored))
 markProfileAppVersion(args.storage,args.storageKey,appVersion)
 return restored
}
