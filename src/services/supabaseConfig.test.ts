import test from 'node:test'
import assert from 'node:assert/strict'
import { readSupabasePublicConfig } from './supabaseConfig.ts'

test('Supabase public config uses the live RtR project by default',()=>{
 const config=readSupabasePublicConfig({})
 assert.equal(config.url,'https://tanizgaletgmzewyqrel.supabase.co')
 assert.match(config.publishableKey,/^sb_publishable_/)
})

test('Supabase public config allows deployment overrides',()=>{
 assert.deepEqual(readSupabasePublicConfig({VITE_SUPABASE_URL:'https://example.supabase.co/',VITE_SUPABASE_PUBLISHABLE_KEY:'pk'}),{url:'https://example.supabase.co',publishableKey:'pk'})
})
