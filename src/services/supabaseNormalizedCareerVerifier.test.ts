import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { projectCareerForRemote } from './careerRemoteProjection.ts'
import { SupabaseRestClient } from './supabaseRestClient.ts'
import { verifyNormalizedCareer } from './supabaseNormalizedCareerVerifier.ts'

const config={url:'https://example.supabase.co',publishableKey:'public-key'}
const session={accessToken:'access',userId:'user-1'}

test('normalized verifier confirms projected local identities exist remotely',async()=>{
 const original=globalThis.fetch
 const career=createInitialCareer()
 career.rideHistory=[{id:'ride-1',date:'2026-10-19T12:00:00Z',source:'Manual',durationMinutes:60,distanceKm:30}]
 career.nutrition.entries=[{id:'food-1',loggedAt:'2026-10-19T13:00:00Z',date:'2026-10-19',mealType:'Snack',name:'Snack'}]
 globalThis.fetch=async input=>{
  const url=String(input)
  const payload=url.includes('/rides?')?[{legacy_source_id:'ride-1'}]:
   url.includes('/nutrition_entries?')?[{local_id:'food-1'}]:
   []
  return new Response(JSON.stringify(payload),{status:200,headers:{'Content-Type':'application/json'}})
 }
 try{
  const result=await verifyNormalizedCareer(new SupabaseRestClient(config,session),'athlete-1',projectCareerForRemote(career))
  assert.equal(result.verified,true)
 }finally{globalThis.fetch=original}
})

test('normalized verifier reports missing projected identities',async()=>{
 const original=globalThis.fetch
 const career=createInitialCareer()
 career.rideHistory=[{id:'ride-missing',date:'2026-10-19T12:00:00Z',source:'Manual',durationMinutes:60,distanceKm:30}]
 globalThis.fetch=async()=>new Response('[]',{status:200,headers:{'Content-Type':'application/json'}})
 try{
  const result=await verifyNormalizedCareer(new SupabaseRestClient(config,session),'athlete-1',projectCareerForRemote(career))
  assert.equal(result.verified,false)
  assert.deepEqual(result.missing.rides,['ride-missing'])
 }finally{globalThis.fetch=original}
})
