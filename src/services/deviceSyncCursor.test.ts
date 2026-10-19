import test from 'node:test'
import assert from 'node:assert/strict'
import { getOrCreateDeviceId, readDeviceSyncCursor, writeDeviceSyncCursor } from './deviceSyncCursor.ts'
import { SupabaseRestClient } from './supabaseRestClient.ts'

const config={url:'https://example.supabase.co',publishableKey:'public-key'}
const session={accessToken:'access',userId:'user-1'}

function memoryStorage(){
 const values=new Map<string,string>()
 return {
  getItem:(key:string)=>values.get(key)??null,
  setItem:(key:string,value:string)=>{values.set(key,value)},
 }
}

test('device id is stable for a browser storage profile',()=>{
 const storage=memoryStorage()
 const first=getOrCreateDeviceId(storage)
 const second=getOrCreateDeviceId(storage)
 assert.equal(first,second)
})

test('device sync cursor round trips through Supabase REST',async()=>{
 const original=globalThis.fetch
 let saved:Record<string,unknown>|null=null
 globalThis.fetch=async(_input,init)=>{
  if(init?.method==='POST'){
   saved=(JSON.parse(String(init.body)) as Array<Record<string,unknown>>)[0]??null
   return new Response('',{status:201})
  }
  return new Response(JSON.stringify(saved?[{device_id:saved.device_id,cursor:saved.cursor,updated_at:saved.updated_at}]:[]),{status:200})
 }
 try{
  const client=new SupabaseRestClient(config,session)
  const written=await writeDeviceSyncCursor({client,athleteId:'athlete-1',deviceId:'device-1',revision:'abc123',updatedAt:'2026-10-19T19:00:00Z'})
  assert.equal(written.revision,'abc123')
  const read=await readDeviceSyncCursor({client,athleteId:'athlete-1',deviceId:'device-1'})
  assert.equal(read?.deviceId,'device-1')
  assert.equal(read?.revision,'abc123')
 }finally{globalThis.fetch=original}
})
