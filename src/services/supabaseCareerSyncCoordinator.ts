import type { CareerState } from '../types/career.ts'
import { remoteProjectionCounts, type RemoteCareerProjection } from './careerRemoteProjection.ts'
import { syncCareerToRemote, type CareerSyncReceipt } from './careerSync.ts'
import { createSupabaseCareerWriter, resolveSupabaseAthleteId } from './supabaseCareerWriter.ts'
import { SupabaseRestClient, type SupabaseSession } from './supabaseRestClient.ts'
import type { SupabasePublicConfig } from './supabaseConfig.ts'

type RiderStateRow={career_snapshot:RemoteCareerProjection|null}

export type VerifiedCareerSyncReceipt=CareerSyncReceipt&{
 athleteId:string
 verified:true
}

export async function syncAndVerifyCareerSnapshot(args:{
 config:SupabasePublicConfig
 session:SupabaseSession
 career:CareerState
 now?:string
}):Promise<VerifiedCareerSyncReceipt>{
 const client=new SupabaseRestClient(args.config,args.session)
 const athleteId=await resolveSupabaseAthleteId(client)
 const writer=createSupabaseCareerWriter(args.config,args.session)
 const receipt=await syncCareerToRemote({athleteId,career:args.career,writer,now:args.now})
 const rows=await client.request<RiderStateRow[]>({
  path:'rider_state',
  query:{select:'career_snapshot',athlete_id:'eq.'+athleteId,limit:'1'},
 })
 const remote=rows[0]?.career_snapshot
 if(!remote)throw new Error('Remote career verification failed: rider snapshot was not returned.')
 const remoteCounts=remoteProjectionCounts(remote)
 if(JSON.stringify(receipt.counts)!==JSON.stringify(remoteCounts)){
  throw new Error('Remote career verification failed: collection counts do not match the local career.')
 }
 return {...receipt,athleteId,verified:true}
}

export const cloudSyncReceiptStorageKey=(accountId:string)=>'ride-the-races-cloud-sync-receipt-v1:'+accountId
