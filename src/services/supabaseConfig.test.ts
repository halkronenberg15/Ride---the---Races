import test from 'node:test'
import assert from 'node:assert/strict'
import { readSupabasePublicConfig } from './supabaseConfig.ts'

test('Supabase public config requires both public values',()=>{
 assert.equal(readSupabasePublicConfig({}),null)
 assert.equal(readSupabasePublicConfig({VITE_SUPABASE_URL:'https://example.supabase.co'}),null)
 assert.deepEqual(readSupabasePublicConfig({VITE_SUPABASE_URL:'https://example.supabase.co/',VITE_SUPABASE_PUBLISHABLE_KEY:'pk'}),{url:'https://example.supabase.co',publishableKey:'pk'})
})
