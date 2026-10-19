import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { readVerifiedCloudCareer } from './supabaseCloudCareerReader.ts'

const config={url:'https://example.supabase.co',publishableKey:'public-key'}
const session={accessToken:'access',userId:'user-1'}

test('cloud career reader resolves athlete and validates snapshot',async()=>{
 const original=globalThis.fetch
 const career=createInitialCareer()
 career.rider.name='Cloud Rider'
 globalThis.fetch=async input=>{
  const url=String(input)
  if(url.includes('/athlete_profiles'))return new Response(JSON.stringify([{athlete_id:'athlete-1'}]),{status:200})
  if(url.includes('/rider_state'))return new Response(JSON.stringify([{career_snapshot:career,updated_at:'2026-10-19T18:30:00Z'}]),{status:200})
  return new Response('not found',{status:404})
 }
 try{
  const result=await readVerifiedCloudCareer({config,session})
  assert.equal(result?.athleteId,'athlete-1')
  assert.equal(result?.career.rider.name,'Cloud Rider')
  assert.equal(result?.updatedAt,'2026-10-19T18:30:00Z')
 }finally{globalThis.fetch=original}
})
