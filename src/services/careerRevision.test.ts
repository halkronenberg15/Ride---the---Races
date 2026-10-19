import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { careerRevision, readCareerLocalMetadata, writeCareerLocalMetadata } from './careerRevision.ts'

test('career revision changes when rider state changes',()=>{
 const a=createInitialCareer()
 const b=createInitialCareer()
 b.rider.name='Changed'
 assert.notEqual(careerRevision(a),careerRevision(b))
 assert.equal(careerRevision(a),careerRevision(createInitialCareer()))
})

test('career metadata round trips through storage',()=>{
 const values=new Map<string,string>()
 const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)}}
 const career=createInitialCareer()
 const written=writeCareerLocalMetadata(storage,'career',career,'2026-10-19T19:00:00Z')
 assert.deepEqual(readCareerLocalMetadata(storage,'career'),written)
})
