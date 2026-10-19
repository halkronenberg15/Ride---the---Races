import type { CareerState } from '../types/career.ts'
import { ensureFreshSupabaseSession, readSupabaseSession } from './supabaseAuth.ts'
import { readSupabasePublicConfig } from './supabaseConfig.ts'
import { syncAndVerifyCareerSnapshot, type VerifiedCareerSyncReceipt } from './supabaseCareerSyncCoordinator.ts'

export type CloudMirrorStatus={
 state:'SUCCESS'|'ERROR'
 at:string
 message:string
 receipt?:VerifiedCareerSyncReceipt
}

const STATUS_KEY='ride-the-races-cloud-mirror-status-v1'

export async function mirrorCareerToCloudIfConnected(career:CareerState):Promise<VerifiedCareerSyncReceipt|null>{
 const session=readSupabaseSession()
 if(!session)return null
 const config=readSupabasePublicConfig()
 const fresh=await ensureFreshSupabaseSession(config,session)
 return syncAndVerifyCareerSnapshot({config,session:fresh,career})
}

export function writeCloudMirrorStatus(status:CloudMirrorStatus,storage:Pick<Storage,'setItem'>=localStorage){
 storage.setItem(STATUS_KEY,JSON.stringify(status))
}

export function readCloudMirrorStatus(storage:Pick<Storage,'getItem'>=localStorage):CloudMirrorStatus|null{
 try{
  const raw=storage.getItem(STATUS_KEY)
  return raw?JSON.parse(raw) as CloudMirrorStatus:null
 }catch{return null}
}
