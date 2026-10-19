import test from 'node:test'
import assert from 'node:assert/strict'
import { createLocalCareerRepository } from './careerRepository.ts'

function memoryStorage(){
 const values=new Map<string,string>()
 return {
  getItem:(key:string)=>values.get(key)??null,
  setItem:(key:string,value:string)=>{values.set(key,value)},
 }
}

test('local career repository creates and persists a rider career',()=>{
 const storage=memoryStorage()
 const repository=createLocalCareerRepository(storage)
 const first=repository.load('career:test','Rider')
 assert.equal(first.rider.name,'Rider')
 first.rider.ftp=229
 repository.save('career:test',first)
 const second=repository.load('career:test','Rider')
 assert.equal(second.rider.ftp,229)
 assert.equal(repository.mode,'LOCAL_BROWSER')
})
