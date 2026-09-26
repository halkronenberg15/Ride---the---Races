import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { lastProfileAppVersion, markProfileAppVersion, readProfileBackups, snapshotBeforeAppUpdate, validateRestoredCareer } from './profileBackups.ts'

function memoryStorage(){
 const data=new Map<string,string>()
 return {
  getItem:(key:string)=>data.get(key)??null,
  setItem:(key:string,value:string)=>{data.set(key,value)},
 }
}

test('creates one pre-update backup before a new app version touches an existing career',()=>{
 const storage=memoryStorage(),key='career:rider-1',raw=JSON.stringify(createInitialCareer())
 markProfileAppVersion(storage,key,'4.0.25')
 const backup=snapshotBeforeAppUpdate(storage,key,raw,'4.0.26')
 assert(backup)
 assert.equal(backup?.appVersion,'4.0.25')
 assert.equal(readProfileBackups(storage,key).length,1)
 assert.equal(lastProfileAppVersion(storage,key),'4.0.25')
})

test('does not create a duplicate backup when the app version is unchanged',()=>{
 const storage=memoryStorage(),key='career:rider-2',raw=JSON.stringify(createInitialCareer())
 markProfileAppVersion(storage,key,'4.0.26')
 assert.equal(snapshotBeforeAppUpdate(storage,key,raw,'4.0.26'),null)
 assert.equal(readProfileBackups(storage,key).length,0)
})

test('backup rotation keeps the five most recent snapshots',()=>{
 const storage=memoryStorage(),key='career:rider-3',raw=JSON.stringify(createInitialCareer())
 for(let i=0;i<7;i++){markProfileAppVersion(storage,key,`4.0.${20+i}`);snapshotBeforeAppUpdate(storage,key,raw,`4.0.${21+i}`)}
 assert.equal(readProfileBackups(storage,key).length,5)
})

test('restored career validation requires core history structures',()=>{
 const career=createInitialCareer()
 assert.equal(validateRestoredCareer(career),career)
 assert.throws(()=>validateRestoredCareer({...career,rideHistory:null as never}),/Ride history/)
})
