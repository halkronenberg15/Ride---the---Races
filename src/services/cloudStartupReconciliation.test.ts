import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { saveSupabaseSession } from './supabaseAuth.ts'
import { evaluateCloudStartup } from './cloudStartupReconciliation.ts'
import { careerStorageKey, type RiderAccount } from './accountStore.ts'
import { writeCareerLocalMetadata } from './careerRevision.ts'

const account:RiderAccount={id:'acct-1',email:'rider@example.com',displayName:'Rider',role:'rider',programs:[],createdAt:'2026-10-19T00:00:00Z'}

function memoryStorage(){
 const values=new Map<string,string>()
 return {
  getItem:(key:string)=>values.get(key)??null,
  setItem:(key:string,value:string)=>{values.set(key,value)},
  removeItem:(key:string)=>{values.delete(key)},
 }
}

test('startup reconciliation allows mirroring when no cloud session exists',async()=>{
 const storage=memoryStorage()
 const result=await evaluateCloudStartup({career:createInitialCareer(),account,storage,now:'2026-10-19T20:00:00Z'})
 assert.equal(result.state,'DISCONNECTED')
 assert.equal(result.allowAutomaticMirror,true)
})

test('startup reconciliation blocks mirroring when cloud is newer',async()=>{
 const original=globalThis.fetch
 const storage=memoryStorage()
 const local=createInitialCareer()
 local.rider.name='Local'
 const remote=createInitialCareer()
 remote.rider.name='Cloud'
 const localSavedAt='2026-10-19T20:00:00Z'
 const cloudSavedAt='2026-10-19T20:05:00Z'
 writeCareerLocalMetadata(storage,careerStorageKey(account.id),local,localSavedAt)
 saveSupabaseSession({accessToken:'access',refreshToken:'refresh',userId:'user-1',expiresAt:Math.floor(Date.now()/1000)+600},storage)
 globalThis.fetch=async input=>{
  const url=String(input)
  if(url.includes('/athlete_profiles'))return new Response(JSON.stringify([{athlete_id:'athlete-1'}]),{status:200})
  if(url.includes('/rider_state'))return new Response(JSON.stringify([{career_snapshot:remote,updated_at:cloudSavedAt,client_revision:null,client_saved_at:cloudSavedAt}]),{status:200})
  return new Response('not found',{status:404})
 }
 try{
  const result=await evaluateCloudStartup({career:local,account,storage,now:'2026-10-19T20:06:00Z'})
  assert.equal(result.state,'CLOUD_NEWER')
  assert.equal(result.allowAutomaticMirror,false)
 }finally{globalThis.fetch=original}
})
