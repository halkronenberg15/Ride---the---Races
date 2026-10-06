import assert from 'node:assert/strict'
import test from 'node:test'
import { environmentPosition, scoreOutdoorStageMatch } from './environmentTranslation.ts'

test('environment translation keeps professional and local geography separate',()=>{
 const position=environmentPosition({professionalCourseKm:82.4,professionalCourseProgress:.42,localRouteKm:31.7,latitude:29.03,longitude:-80.93})
 assert.equal(position.professionalCourseKm,82.4)
 assert.equal(position.localRouteKm,31.7)
 assert.notEqual(position.professionalCourseKm,position.localRouteKm)
})

test('safety outranks race fidelity',()=>{
 const result=scoreOutdoorStageMatch({
  stage:{classification:'Mountain',workload:'VERY_HIGH',terrainSequence:['climb','descent','climb'],climbCount:3,decisiveFinale:'summit',narrativeWeights:{climbing:.8,rolling:.1,sprinting:0,tactics:.1}},
  local:{distanceKm:80,elevationGainM:1400,climbCount:3,surface:'paved',routable:true,hazardousDescents:4,daylightSuitable:true},
 })
 assert.equal(result.safetyEligible,false)
 assert.ok(result.similarity<.75)
})

test('safe matching terrain scores strongly without fabricating race geography',()=>{
 const result=scoreOutdoorStageMatch({
  stage:{classification:'Hilly',workload:'HIGH',terrainSequence:['rolling','climb','descent','climb'],climbCount:2,decisiveFinale:'late climb',narrativeWeights:{climbing:.5,rolling:.3,sprinting:.05,tactics:.15}},
  local:{distanceKm:70,elevationGainM:1150,climbCount:2,surface:'paved',routable:true,hazardousDescents:0,daylightSuitable:true,trafficSignals:2},
 })
 assert.equal(result.safetyEligible,true)
 assert.ok(result.similarity>.7)
})
