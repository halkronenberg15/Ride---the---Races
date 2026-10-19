import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { syncAndVerifyCareerSnapshot } from './supabaseCareerSyncCoordinator.ts'

const config={url:'https://example.supabase.co',publishableKey:'public-key'}
const session={accessToken:'access-token',userId:'user-1'}

test('verified cloud sync writes then reads back the rider snapshot',async()=>{
 const original=globalThis.fetch
 const career=createInitialCareer()
 career.nutrition.entries=[{id:'food-1',loggedAt:'2026-10-19T12:00:00Z',date:'2026-10-19',mealType:'Snack',name:'Test'}]
 let writtenSnapshot:unknown
 globalThis.fetch=async(input,init)=>{
  const url=String(input)
  if(url.includes('/athlete_profiles'))return new Response(JSON.stringify([{athlete_id:'athlete-1'}]),{status:200})
  if(url.includes('/rider_state')&&init?.method==='POST'){
   const body=JSON.parse(String(init.body)) as Array<Record<string,unknown>>
   writtenSnapshot=body[0]?.career_snapshot
   return new Response('',{status:201})
  }
  if(url.includes('/rider_state'))return new Response(JSON.stringify([{career_snapshot:writtenSnapshot}]),{status:200})
  return new Response('not found',{status:404})
 }
 try{
  const receipt=await syncAndVerifyCareerSnapshot({config,session,career,now:'2026-10-19T12:30:00Z'})
  assert.equal(receipt.verified,true)
  assert.equal(receipt.athleteId,'athlete-1')
  assert.equal(receipt.counts.nutritionEntries,1)
 }finally{globalThis.fetch=original}
})
