import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { projectCareerForRemote, remoteProjectionCounts } from './careerRemoteProjection.ts'
import { syncCareerToRemote } from './careerSync.ts'

test('remote projection preserves authoritative rider collections',()=>{
 const career=createInitialCareer()
 career.rideHistory=[{id:'ride-1',date:'2026-10-18T12:00:00Z',source:'Manual',durationMinutes:45,distanceKm:20,race:'Training',stageNumber:0,tactic:'Balanced',recovery:career.health}]
 career.nutrition.entries=[{id:'food-1',loggedAt:'2026-10-18T12:00:00Z',date:'2026-10-18',mealType:'Snack',name:'Test meal'}]
 const projection=projectCareerForRemote(career)
 assert.equal(projection.rides.length,1)
 assert.equal(projection.nutrition.entries.length,1)
 assert.deepEqual(remoteProjectionCounts(projection),{rides:1,nutritionEntries:1,nutritionTemplates:0,readinessEntries:0,trainingJournalEntries:0})
})

test('remote sync returns a count receipt after writer succeeds',async()=>{
 const career=createInitialCareer()
 let called=false
 const receipt=await syncCareerToRemote({userId:'user-1',career,now:'2026-10-18T23:00:00Z',writer:{async writeProjection(userId,projection){called=true;assert.equal(userId,'user-1');assert.equal(projection.riderState.schemaVersion,career.schemaVersion)}}})
 assert.equal(called,true)
 assert.equal(receipt.localSchemaVersion,career.schemaVersion)
 assert.equal(receipt.syncedAt,'2026-10-18T23:00:00Z')
})
