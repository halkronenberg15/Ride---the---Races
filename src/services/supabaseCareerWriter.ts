import type { RemoteCareerProjection } from './careerRemoteProjection.ts'
import type { RemoteCareerWriter } from './careerSync.ts'
import { SupabaseRestClient, type SupabaseSession } from './supabaseRestClient.ts'
import type { SupabasePublicConfig } from './supabaseConfig.ts'
import { writeNormalizedCareer } from './supabaseNormalizedCareerWriter.ts'
import { careerRevision } from './careerRevision.ts'

type AthleteProfileRow={athlete_id:string}

export async function resolveSupabaseAthleteId(client:SupabaseRestClient):Promise<string>{
 const rows=await client.request<AthleteProfileRow[]>({
  path:'athlete_profiles',
  query:{select:'athlete_id',limit:'1'},
 })
 const athleteId=rows[0]?.athlete_id
 if(!athleteId)throw new Error('No Supabase athlete profile is linked to this authenticated account.')
 return athleteId
}

export function createSupabaseCareerWriter(config:SupabasePublicConfig,session:SupabaseSession):RemoteCareerWriter{
 const client=new SupabaseRestClient(config,session)
 return {
  async writeProjection(athleteId:string,projection:RemoteCareerProjection){
   await writeNormalizedCareer(client,athleteId,projection)
   const savedAt=new Date().toISOString()
   await client.request<void>({
    method:'POST',
    path:'rider_state',
    query:{on_conflict:'athlete_id'},
    prefer:'resolution=merge-duplicates,return=minimal',
    body:[{
     athlete_id:athleteId,
     schema_version:projection.riderState.schemaVersion,
     rider:projection.riderState.rider,
     equipment:projection.riderState.equipment,
     season:projection.riderState.season,
     settings:projection.riderState.settings,
     career_snapshot:projection.careerSnapshot,
     client_revision:careerRevision(projection.careerSnapshot),
     client_saved_at:savedAt,
     updated_at:savedAt,
    }],
   })
  },
 }
}
