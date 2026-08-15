import assert from 'node:assert/strict'
import test from 'node:test'
import { vuelta2026, vueltaRideStages, type ProfessionalStage } from './professionalRaces.ts'
import { raceStages } from './raceStages.ts'

const elevations=(n:number)=>vuelta2026.stages[n-1].profilePoints.map(point=>point.elevationM)
test('Alpha 4.0.8 registers 21 unique verified Vuelta profiles and two correctly placed rest days',()=>{
 assert.equal(vuelta2026.stages.length,21); assert.deepEqual(vuelta2026.restDays.map(day=>day.afterStage),[9,15])
 assert.equal(new Set(vuelta2026.stages.map(stage=>JSON.stringify(stage.profilePoints))).size,21)
 for(const stage of vuelta2026.stages){assert.ok(stage.profilePoints.length>=11);assert.ok(stage.verification.profile);assert.ok(stage.verification.source&&stage.verification.reference&&stage.verification.updatedAt)}
})
test('Vuelta signature terrain remains identifiable in authoritative metre data',()=>{
 assert.equal(vuelta2026.stages[0].officialDistanceKm,9.4)
 assert.ok(elevations(3).at(-1)!>Math.max(...elevations(3).slice(0,7))+1000)
 assert.ok(elevations(4).filter((v,i,a)=>i>0&&i<a.length-1&&v>a[i-1]+300&&v>a[i+1]+300).length>=3)
 assert.ok(elevations(7).at(-1)!-elevations(7)[0]>1500); assert.ok(elevations(9).at(-1)!-elevations(9).at(-2)!>400)
 assert.ok(elevations(12).at(-1)!>2000); assert.ok(elevations(16).at(-1)!<elevations(16)[0]); assert.ok(Math.max(...elevations(17))-Math.min(...elevations(17))<250)
 assert.match(vuelta2026.stages[17].classification,/time trial/i); assert.ok(Math.max(...elevations(18))-Math.min(...elevations(18))<50)
 assert.ok(Math.min(...elevations(19).slice(-7,-4))<30&&elevations(19).at(-1)!>1200)
 assert.ok(Math.min(...elevations(20))>1100); assert.ok(elevations(21).slice(-9).filter((v,i,a)=>i>0&&i<a.length-1&&v>a[i-1]&&v>a[i+1]).length>=3)
})
test('verification and workout readiness are independent production states',()=>{
 assert.equal(vueltaRideStages.filter(stage=>stage.profileVerified).length,21); assert.equal(vueltaRideStages.filter(stage=>stage.workoutReady).length,9)
 const valid=(stage:ProfessionalStage)=>!stage.verification.profile||Boolean(stage.verification.source&&stage.verification.reference&&stage.verification.updatedAt)
 assert.ok(vuelta2026.stages.every(valid)); assert.ok(vuelta2026.stages.slice(9).every(stage=>stage.verification.profile&&!stage.workoutReady))
})
test('currently rideable Tour stages retain explicit course-audit provenance',()=>{for(const stage of raceStages){assert.equal(stage.profileVerified,true);assert.ok(stage.profileSource&&stage.profileReference&&stage.profileUpdatedAt)}})
