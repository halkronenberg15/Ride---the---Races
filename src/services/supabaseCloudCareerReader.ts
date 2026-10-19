import type { CareerState } from '../types/career.ts'
import { migrateCareer } from '../state/careerPersistence.ts'
import { validateRestoredCareer } from './profileBackups.ts'
import { resolveSupabaseAthleteId } from './supabaseCareerWriter.ts'
import { SupabaseRestClient, type SupabaseSession } from './supabaseRestClient.ts'
import type { SupabasePublicConfig } from './supabaseConfig.ts'

type RiderStateRow={
 career_snapshot:Partial<CareerState>|null
 updated_at:string
}

export type CloudCareerSnapshot={
 athleteId:string
 updatedAt:string
 career:CareerState
}

export async function readVerifiedCloudCareer(args:{
 config:SupabasePublicConfig
 session:SupabaseSession
}):Promise<CloudCareerSnapshot|null>{
 const client=new SupabaseRestClient(args.config,args.session)
 const athleteId=await resolveSupabaseAthleteId(client)
 const rows=await client.request<RiderStateRow[]>({
  path:'rider_state',
  query:{select:'career_snapshot,updated_at',athlete_id:'eq.'+athleteId,limit:'1'},
 })
 const row=rows[0]
 if(!row?.career_snapshot)return null
 const career=validateRestoredCareer(migrateCareer(row.career_snapshot))
 return {athleteId,updatedAt:row.updated_at,career}
}
