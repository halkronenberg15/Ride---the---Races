import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { markProfileAppVersion, readProfileBackups, restoreProfileBackup, snapshotBeforeAppUpdate } from './profileBackups.ts'

class MemoryStorage {
 private data=new Map<string,string>()
 getItem(key:string){return this.data.get(key)??null}
 setItem(key:string,value:string){this.data.set(key,value)}
}

test('version change snapshots the existing rider profile once',()=>{
 const storage=new MemoryStorage()
 const key='career:rider'
 const raw=JSON.stringify(createInitialCareer())
 markProfileAppVersion(storage,key,'4.0.25')
 const backup=snapshotBeforeAppUpdate(storage,key,raw,'4.0.26')
 assert(backup)
 assert.equal(readProfileBackups(storage,key).length,1)
 assert.equal(snapshotBeforeAppUpdate(storage,key,raw,'4.0.25'),null)
})

test('restoring a backup first protects the current profile',()=>{
 const storage=new MemoryStorage()
 const key='career:rider'
 const original={...createInitialCareer(),rider:{...createInitialCareer().rider,name:'Original'}}
 storage.setItem(key,JSON.stringify(original))
 markProfileAppVersion(storage,key,'4.0.25')
 const target=snapshotBeforeAppUpdate(storage,key,JSON.stringify(original),'4.0.26')
 assert(target)
 storage.setItem(key,JSON.stringify({...original,rider:{...original.rider,name:'Current'}}))
 restoreProfileBackup(storage,key,target!.id,'4.0.26')
 const restored=JSON.parse(storage.getItem(key)!)
 assert.equal(restored.rider.name,'Original')
 assert(readProfileBackups(storage,key).some(item=>item.reason==='PRE_RESTORE'))
})

test('automatic backup history is capped at five',()=>{
 const storage=new MemoryStorage()
 const key='career:rider'
 for(let i=0;i<7;i++){
  markProfileAppVersion(storage,key,`4.0.${i}`)
  snapshotBeforeAppUpdate(storage,key,JSON.stringify({...createInitialCareer(),rider:{...createInitialCareer().rider,name:String(i)}}),`4.1.${i}`)
 }
 assert.equal(readProfileBackups(storage,key).length,5)
})
