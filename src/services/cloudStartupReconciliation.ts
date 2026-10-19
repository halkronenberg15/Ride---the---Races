import type { CareerState } from '../types/career.ts'
import { careerStorageKey, type RiderAccount } from './accountStore.ts'
import { readCareerLocalMetadata } from './careerRevision.ts'
import { reconcileCareerVersions, type CareerReconciliationState } from './careerReconciliation.ts'
import { ensureFreshSupabaseSession, readSupabaseSession } from './supabaseAuth.ts'
import { readVerifiedCloudCareer } from './supabaseCloudCareerReader.ts'
import { readSupabasePublicConfig } from './supabaseConfig.ts'

export type CloudStartupState='DISCONNECTED'|'NO_CLOUD_COPY'|'MATCHED'|'LOCAL_NEWER'|'CLOUD_NEWER'|'DIVERGED'|'ERROR'

export type CloudStartupStatus={
 state:CloudStartupState
 checkedAt:string
 allowAutomaticMirror:boolean
 message:string
 cloudUpdatedAt?:string
}

const STATUS_KEY='ride-the-races-cloud-startup-status-v1'

export async function evaluateCloudStartup(args:{
 career:CareerState
 account:RiderAccount
 storage:Pick<Storage,'getItem'>
 now?:string
}):Promise<CloudStartupStatus>{
 const checkedAt=args.now??new Date().toISOString()
 const session=readSupabaseSession(args.storage)
 if(!session)return {state:'DISCONNECTED',checkedAt,allowAutomaticMirror:true,message:'No cloud account is connected on this device.'}
 try{
  const config=readSupabasePublicConfig()
  const fresh=await ensureFreshSupabaseSession(config,session)
  const cloud=await readVerifiedCloudCareer({config,session:fresh})
  if(!cloud)return {state:'NO_CLOUD_COPY',checkedAt,allowAutomaticMirror:true,message:'No cloud career exists yet. This device can seed the cloud copy.'}
  const localMetadata=readCareerLocalMetadata(args.storage,careerStorageKey(args.account.id))
  const reconciliation=reconcileCareerVersions(args.career,localMetadata,cloud)
  const allowAutomaticMirror=reconciliation.state==='MATCHED'||reconciliation.state==='LOCAL_NEWER'
  return {
   state:reconciliation.state as Exclude<CareerReconciliationState,never>,
   checkedAt,
   allowAutomaticMirror,
   message:reconciliation.message,
   cloudUpdatedAt:cloud.clientSavedAt??cloud.updatedAt,
  }
 }catch(value){
  return {state:'ERROR',checkedAt,allowAutomaticMirror:false,message:value instanceof Error?value.message:'Cloud startup reconciliation failed.'}
 }
}

export function writeCloudStartupStatus(status:CloudStartupStatus,storage:Pick<Storage,'setItem'>=localStorage){
 storage.setItem(STATUS_KEY,JSON.stringify(status))
}

export function readCloudStartupStatus(storage:Pick<Storage,'getItem'>=localStorage):CloudStartupStatus|null{
 try{
  const raw=storage.getItem(STATUS_KEY)
  return raw?JSON.parse(raw) as CloudStartupStatus:null
 }catch{return null}
}
