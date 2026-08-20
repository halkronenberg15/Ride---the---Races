import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { raceIdentities, trainingRides, vuelta2026, vueltaRideStages } from '../data/raceLibrary.ts'
import { adaptSegments } from './adaptiveRide.ts'
import { COURSE_MARKER_HEIGHT, createRoadModel, markerGeometry } from './roadModel.ts'

const source=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8')

test('Jean is relocated from rider Home to the opening Team Bus experience',()=>{
  assert.doesNotMatch(source('../screens/TeamHQScreen.tsx'),/Jean Moreau|Hear Jean|TEAM PHILOSOPHY/)
  const bus=source('../screens/TeamBusScreen.tsx')
  assert.match(bus,/Jean Moreau/); assert.match(bus,/TEAM PHILOSOPHY/); assert.match(bus,/Hear Jean/)
  assert.match(bus,/SEASONS/); assert.match(bus,/TRAINING RIDES/); assert.match(bus,/TEAM ROSTER/)
})

test('all four training workouts have exact durations, targets, and FTP scaling',()=>{
  assert.equal(trainingRides.length,4)
  assert.deepEqual(trainingRides.map(r=>r.durationMinutes),[30,45,30,45])
  for(const ride of trainingRides) assert.ok(ride.stage.segments.every(s=>s.power&&s.cadence&&s.resistance))
  const base=adaptSegments(trainingRides[0].stage.segments,206,'Balanced')[0].power
  const stronger=adaptSegments(trainingRides[0].stage.segments,250,'Balanced')[0].power
  assert.notEqual(base,stronger)
})

test('all La Vuelta stages are complete synchronized-engine stage definitions',()=>{
  assert.equal(vuelta2026.stages.length,21); assert.equal(vueltaRideStages.length,21)
  for(const stage of vueltaRideStages.filter(stage=>stage.workoutReady)){assert.ok(stage.segments.length>=5);assert.ok(stage.segments.every(s=>s.sec>0&&s.power&&s.cadence&&s.resistance));assert.ok(vuelta2026.stages[stage.number-1].rideable)}
  assert.ok(vuelta2026.stages.every(stage=>stage.rideable))
})

test('course markers use metadata colors and fixed upward-only local geometry',()=>{
  const stage=vueltaRideStages[6]
  const model=createRoadModel(stage.number,stage.segments,stage.distanceKm,raceIdentities['vuelta-2026'])
  for(const marker of model.markers){assert.equal(marker.localY-marker.topY,COURSE_MARKER_HEIGHT);assert.ok(marker.topY<marker.localY)}
  assert.equal(model.markers.find(m=>m.type==='kilometre-zero')?.color,'#ffd400')
  assert.equal(raceIdentities['vuelta-2026'].komColor,'#ef3340')
  assert.equal(raceIdentities['vuelta-2026'].pointsColor,'#00a6a6')
  assert.equal(model.markers.find(m=>m.type==='finish')?.color,'#ffffff')
  assert.equal(raceIdentities['tour-2026'].pointsColor,'#38a852')
  assert.deepEqual(markerGeometry(80),{localY:80,topY:52,height:28})
  assert.deepEqual(markerGeometry(40),{localY:40,topY:12,height:28})
})
