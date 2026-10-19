import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { projectCareerForRemote } from './careerRemoteProjection.ts'
import { createSupabaseCareerWriter, resolveSupabaseAthleteId } from './supabaseCareerWriter.ts'
import { SupabaseRestClient } from './supabaseRestClient.ts'

const config={url:'https://example.supabase.co',publishableKey:'public-key'}
const session={accessToken:'access-token',userId:'user-1'}

test('athlete resolver reads the authenticated athlete profile',async()=>{
 const original=globalThis.fetch
 globalThis.fetch=async()=>new Response(JSON.stringify([{athlete_id:'athlete-1'}]),{status:200,headers:{'Content-Type':'application/json'}})
 try{
  const client=new SupabaseRestClient(config,session)
  assert.equal(await resolveSupabaseAthleteId(client),'athlete-1')
 }finally{globalThis.fetch=original}
})

test('Supabase writer upserts the current remote projection snapshot',async()=>{
 const original=globalThis.fetch
 let requestBody:unknown
 let requestUrl=''
 globalThis.fetch=async(input,init)=>{
  requestUrl=String(input)
  requestBody=JSON.parse(String(init?.body??'null'))
  return new Response('',{status:201})
 }
 try{
  const projection=projectCareerForRemote(createInitialCareer())
  const writer=createSupabaseCareerWriter(config,session)
  await writer.writeProjection('athlete-1',projection)
  assert.match(requestUrl,/rider_state/)
  assert.match(requestUrl,/on_conflict=athlete_id/)
  const rows=requestBody as Array<Record<string,unknown>>
  assert.equal(rows[0]?.athlete_id,'athlete-1')
  assert.equal(rows[0]?.schema_version,6)
  assert.ok(rows[0]?.career_snapshot)
 }finally{globalThis.fetch=original}
})
