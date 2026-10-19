import test from 'node:test'
import assert from 'node:assert/strict'
import { readCloudMirrorStatus, writeCloudMirrorStatus } from './cloudCareerMirror.ts'

test('cloud mirror status round trips through storage',()=>{
 const values=new Map<string,string>()
 const storage={
  getItem:(key:string)=>values.get(key)??null,
  setItem:(key:string,value:string)=>{values.set(key,value)},
 }
 const status={state:'SUCCESS' as const,at:'2026-10-19T18:30:00Z',message:'Verified'}
 writeCloudMirrorStatus(status,storage)
 assert.deepEqual(readCloudMirrorStatus(storage),status)
})
