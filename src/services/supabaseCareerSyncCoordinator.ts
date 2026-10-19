import type { CareerState } from '../types/career.ts'
import { projectCareerForRemote, remoteProjectionCounts } from './careerRemoteProjection.ts'
import { syncCareerToRemote, type CareerSyncReceipt } from './careerSync.ts'
import { createSupabaseCareerWriter, resolveSupabaseAthleteId } from './supabaseCareerWriter.ts'
import { SupabaseRestClient, type SupabaseSession } from './supabaseRestClient.ts'
import type { SupabasePublicConfig } from './supabaseConfig.ts'
import { careerRevision } from './careerRevision.ts'
import { verifyNormalizedCareer } from './supabaseNormalizedCareerVerifier.ts'
import { getOrCreateDeviceId, writeDeviceSyncCursor } from './deviceSyncCursor.ts'

type RiderStateRow={career_snapshot:CareerState|null;client_revision:string|null;client_saved_at:string|null}

export type VerifiedCareerSyncReceipt=CareerSyncReceipt&{
 athleteId:string
 verified:true
 normalizedVerified:true
 revision:string
 cloudSavedAt:string
 deviceId?:string
}

export async function syncAndVerifyCareerSnapshot(args:{
 config:SupabasePublicConfig
 session:SupabaseSession
 career:CareerState
 now?:string
 deviceId?:string
}):Promise<VerifiedCareerSyncReceipt>{
 const client=new SupabaseRestClient(args.config,args.session)
 const athleteId=await resolveSupabaseAthleteId(client)
 const writer=createSupabaseCareerWriter(args.config,args.session)
 const receipt=await syncCareerToRemote({athleteId,career:args.career,writer,now:args.now})
 const rows=await client.request<RiderStateRow[]>({
  path:'rider_state',
  query:{select:'career_snapshot,client_revision,client_saved_at',athlete_id:'eq.'+athleteId,limit:'1'},
 })
 const remoteRow=rows[0]
 const remote=remoteRow?.career_snapshot
 if(!remote)throw new Error('Remote career verification failed: rider snapshot was not returned.')
 const remoteCounts=remoteProjectionCounts(projectCareerForRemote(remote))
 if(JSON.stringify(receipt.counts)!==JSON.stringify(remoteCounts)){
  throw new Error('Remote career verification failed: collection counts do not match the local career.')
 }
 const revision=careerRevision(args.career)
 if(remoteRow?.client_revision!==revision||!remoteRow.client_saved_at){
  throw new Error('Remote career verification failed: snapshot revision metadata does not match the local career.')
 }
 const normalized=await verifyNormalizedCareer(client,athleteId,projectCareerForRemote(args.career))
 if(!normalized.verified){
  throw new Error('Remote career verification failed: normalized rider tables are missing projected records.')
 }
 const deviceId=args.deviceId??(typeof localStorage==='undefined'?undefined:getOrCreateDeviceId())
 if(deviceId)await writeDeviceSyncCursor({client,athleteId,deviceId,revision,updatedAt:remoteRow.client_saved_at})
 return {...receipt,athleteId,verified:true,normalizedVerified:true,revision,cloudSavedAt:remoteRow.client_saved_at,...(deviceId?{deviceId}:{})}
}

export const cloudSyncReceiptStorageKey=(accountId:string)=>'ride-the-races-cloud-sync-receipt-v1:'+accountId
