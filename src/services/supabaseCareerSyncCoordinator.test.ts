import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { careerRevision } from './careerRevision.ts'
import { syncAndVerifyCareerSnapshot } from './supabaseCareerSyncCoordinator.ts'

const config={url:'https://example.supabase.co',publishableKey:'public-key'}
const session={accessToken:'access-token',userId:'user-1'}

test('verified cloud sync validates snapshot revision and normalized tables',async()=>{
 const original=globalThis.fetch
 const career=createInitialCareer()
 let cursorBody:Record<string,unknown>|null=null
 career.nutrition.entries=[{id:'food-1',loggedAt:'2026-10-19T12:00:00Z',date:'2026-10-19',mealType:'Snack',name:'Test'}]
 let writtenSnapshot:unknown
 let writtenRevision=''
 let writtenSavedAt=''
 globalThis.fetch=async(input,init)=>{
  const url=String(input)
  const method=String(init?.method??'GET')
  if(url.includes('/athlete_profiles')&&method==='GET')return new Response(JSON.stringify([{athlete_id:'athlete-1'}]),{status:200})
  if(url.includes('/rider_state')&&method==='POST'){
   const body=JSON.parse(String(init?.body)) as Array<Record<string,unknown>>
   writtenSnapshot=body[0]?.career_snapshot
   writtenRevision=String(body[0]?.client_revision??'')
   writtenSavedAt=String(body[0]?.client_saved_at??'')
   return new Response('',{status:201})
  }
  if(url.includes('/rider_state')&&method==='GET'){
   return new Response(JSON.stringify([{career_snapshot:writtenSnapshot,client_revision:writtenRevision,client_saved_at:writtenSavedAt}]),{status:200})
  }
  if(url.includes('/nutrition_entries')&&method==='GET')return new Response(JSON.stringify([{local_id:'food-1'}]),{status:200})
  if(url.includes('/sync_cursors')&&method==='POST'){
   cursorBody=(JSON.parse(String(init?.body)) as Array<Record<string,unknown>>)[0]??null
   return new Response('',{status:201})
  }
  if(method==='GET')return new Response('[]',{status:200})
  return new Response('',{status:201})
 }
 try{
  const receipt=await syncAndVerifyCareerSnapshot({config,session,career,now:'2026-10-19T12:30:00Z',deviceId:'device-1'})
  assert.equal(receipt.verified,true)
  assert.equal(receipt.normalizedVerified,true)
  assert.equal(receipt.athleteId,'athlete-1')
  assert.equal(receipt.counts.nutritionEntries,1)
  assert.equal(receipt.revision,careerRevision(career))
  assert.ok(receipt.cloudSavedAt)
  assert.equal(receipt.deviceId,'device-1')
  const savedCursor=cursorBody as Record<string,unknown>|null
  assert.ok(savedCursor)
  assert.equal(savedCursor['device_id'],'device-1')
  assert.equal(savedCursor['cursor'],receipt.revision)
 }finally{globalThis.fetch=original}
})
