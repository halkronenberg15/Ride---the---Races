import test from 'node:test'
import assert from 'node:assert/strict'
import { ensureFreshSupabaseSession, readSupabaseSession, saveSupabaseSession, signInSupabase } from './supabaseAuth.ts'

const config={url:'https://example.supabase.co',publishableKey:'public-key'}

test('Supabase sign in stores a refreshable session',async()=>{
 const original=globalThis.fetch
 const storage=new Map<string,string>()
 const originalLocalStorage=globalThis.localStorage
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value),removeItem:(key:string)=>storage.delete(key)}})
 globalThis.fetch=async()=>new Response(JSON.stringify({access_token:'access',refresh_token:'refresh',expires_at:9999999999,user:{id:'user-1'}}),{status:200})
 try{
  const session=await signInSupabase(config,'rider@example.com','password123')
  assert.equal(session.userId,'user-1')
  assert.equal(readSupabaseSession()?.refreshToken,'refresh')
 }finally{
  globalThis.fetch=original
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:originalLocalStorage})
 }
})

test('fresh Supabase sessions do not refresh unnecessarily',async()=>{
 const session={accessToken:'access',refreshToken:'refresh',userId:'user-1',expiresAt:Math.floor(Date.now()/1000)+600}
 assert.equal(await ensureFreshSupabaseSession(config,session),session)
})

test('session helpers round trip with supplied storage',()=>{
 const values=new Map<string,string>()
 const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)}
 const session={accessToken:'a',refreshToken:'r',userId:'u'}
 saveSupabaseSession(session,storage)
 assert.deepEqual(readSupabaseSession(storage),session)
})
