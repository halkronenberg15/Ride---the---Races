import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { projectCareerForRemote } from './careerRemoteProjection.ts'
import { writeNormalizedCareer } from './supabaseNormalizedCareerWriter.ts'
import { SupabaseRestClient } from './supabaseRestClient.ts'

const config={url:'https://example.supabase.co',publishableKey:'public-key'}
const session={accessToken:'access',userId:'user-1'}

test('normalized writer uses stable local identity keys for rider domains',async()=>{
 const original=globalThis.fetch
 const requests:Array<{url:string;method:string;body:unknown}>=[]
 globalThis.fetch=async(input,init)=>{
  requests.push({url:String(input),method:String(init?.method??'GET'),body:init?.body?JSON.parse(String(init.body)):null})
  return new Response('',{status:201})
 }
 try{
  const career=createInitialCareer()
  career.rider.name='Hal'
  career.rideHistory=[{id:'local-ride-1',date:'2026-10-18T12:00:00Z',source:'Manual',durationMinutes:45,distanceKm:20}]
  career.nutrition.entries=[{id:'local-food-1',loggedAt:'2026-10-18T13:00:00Z',date:'2026-10-18',mealType:'Snack',name:'Fairlife'}]
  career.nutrition.mealTemplates=[{id:'local-template-1',name:'Fairlife',mealType:'Snack',timesUsed:2,lastUsedAt:'2026-10-18T13:00:00Z'}]
  const client=new SupabaseRestClient(config,session)
  await writeNormalizedCareer(client,'athlete-1',projectCareerForRemote(career))

  const ride=requests.find(item=>item.url.includes('/rides?'))
  assert.ok(ride)
  assert.match(ride!.url,/on_conflict=athlete_id%2Clegacy_source_id/)
  assert.equal((ride!.body as Array<Record<string,unknown>>)[0]?.legacy_source_id,'local-ride-1')

  const nutrition=requests.find(item=>item.url.includes('/nutrition_entries?'))
  assert.ok(nutrition)
  assert.equal((nutrition!.body as Array<Record<string,unknown>>)[0]?.local_id,'local-food-1')

  const template=requests.find(item=>item.url.includes('/nutrition_templates?'))
  assert.ok(template)
  assert.equal((template!.body as Array<Record<string,unknown>>)[0]?.local_id,'local-template-1')

  const profile=requests.find(item=>item.url.includes('/athlete_profiles?'))
  assert.equal(profile?.method,'PATCH')
 }finally{globalThis.fetch=original}
})
