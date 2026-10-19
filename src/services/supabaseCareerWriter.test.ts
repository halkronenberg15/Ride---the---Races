import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { careerRevision } from './careerRevision.ts'
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

test('Supabase writer persists revisioned snapshot and normalized career',async()=>{
 const original=globalThis.fetch
 const requests:Array<{url:string;method:string;body:unknown}>=[]
 globalThis.fetch=async(input,init)=>{
  requests.push({url:String(input),method:String(init?.method??'GET'),body:init?.body?JSON.parse(String(init.body)):null})
  return new Response('',{status:201})
 }
 try{
  const career=createInitialCareer()
  career.rideHistory=[{id:'ride-1',date:'2026-10-19T12:00:00Z',source:'Manual',durationMinutes:45,distanceKm:20}]
  const writer=createSupabaseCareerWriter(config,session)
  await writer.writeProjection('athlete-1',projectCareerForRemote(career))

  const snapshot=requests.find(item=>item.url.includes('/rider_state?'))
  assert.ok(snapshot)
  const rows=snapshot!.body as Array<Record<string,unknown>>
  assert.equal(rows[0]?.athlete_id,'athlete-1')
  assert.equal(rows[0]?.schema_version,6)
  assert.equal(rows[0]?.client_revision,careerRevision(career))
  assert.ok(rows[0]?.client_saved_at)

  const ride=requests.find(item=>item.url.includes('/rides?'))
  assert.ok(ride)
  assert.equal((ride!.body as Array<Record<string,unknown>>)[0]?.legacy_source_id,'ride-1')
  assert.ok(requests.indexOf(ride!)<requests.indexOf(snapshot!),'normalized rows must persist before the snapshot commit marker')
 }finally{globalThis.fetch=original}
})


test('Supabase writer does not advance snapshot when normalized persistence fails',async()=>{
 const original=globalThis.fetch
 const requests:string[]=[]
 globalThis.fetch=async input=>{
  const url=String(input)
  requests.push(url)
  if(url.includes('/rides?'))return new Response('normalized failure',{status:500})
  return new Response('',{status:201})
 }
 try{
  const career=createInitialCareer()
  career.rideHistory=[{id:'ride-fail',date:'2026-10-19T12:00:00Z',source:'Manual',durationMinutes:45,distanceKm:20}]
  const writer=createSupabaseCareerWriter(config,session)
  await assert.rejects(()=>writer.writeProjection('athlete-1',projectCareerForRemote(career)),/Supabase request failed/)
  assert.equal(requests.some(url=>url.includes('/rider_state?')),false)
 }finally{globalThis.fetch=original}
})
