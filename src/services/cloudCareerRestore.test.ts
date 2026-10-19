import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { buildCloudRestorePreview, commitCloudCareerRestore } from './cloudCareerRestore.ts'

function memoryStorage(){
 const values=new Map<string,string>()
 return {
  getItem:(key:string)=>values.get(key)??null,
  setItem:(key:string,value:string)=>{values.set(key,value)},
  values,
 }
}

test('cloud restore preview compares local and remote rider data',()=>{
 const local=createInitialCareer();local.rider.name='Local';local.rider.number=7
 const remote=createInitialCareer();remote.rider.name='Cloud';remote.rider.number=8
 const preview=buildCloudRestorePreview(local,{athleteId:'a',updatedAt:'2026-10-19T18:00:00Z',career:remote})
 assert.equal(preview.identityDiffers,true)
 assert.equal(preview.cloud.riderName,'Cloud')
})

test('cloud restore refuses replacement without confirmation',()=>{
 const local=createInitialCareer()
 assert.throws(()=>commitCloudCareerRestore({storage:memoryStorage(),storageKey:'career',localCareer:local,cloud:{athleteId:'a',updatedAt:'2026-10-19T18:00:00Z',career:local},confirmed:false}),/explicit confirmation/)
})

test('cloud restore preserves current profile before replacement',()=>{
 const local=createInitialCareer();local.rider.name='Local'
 const remote=createInitialCareer();remote.rider.name='Cloud'
 const storage=memoryStorage()
 storage.setItem('career',JSON.stringify(local))
 const restored=commitCloudCareerRestore({storage,storageKey:'career',localCareer:local,cloud:{athleteId:'a',updatedAt:'2026-10-19T18:00:00Z',career:remote},confirmed:true,appVersion:'4.1.0-test'})
 assert.equal(restored.rider.name,'Cloud')
 assert.equal(JSON.parse(storage.getItem('career')??'{}').rider.name,'Cloud')
 assert.ok(storage.getItem('career:backups:v1'))
})
