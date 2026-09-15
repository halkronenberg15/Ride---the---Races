import test from 'node:test'
import assert from 'node:assert/strict'
import { trainingRides, vuelta2026 } from './raceLibrary.ts'
test('Vuelta calendar is an isolated complete 21-stage shell',()=>{ assert.equal(vuelta2026.stages.length,21); assert.equal(vuelta2026.restDays.length,2); assert.equal(vuelta2026.stages[17].distanceKm,32.5) })
test('training library preserves four legacy rides and adds six Intro rides',()=>{ assert.equal(trainingRides.filter(ride=>!ride.id.startsWith('intro-')).length,4);assert.equal(trainingRides.filter(ride=>ride.id.startsWith('intro-')).length,6); assert.ok(trainingRides.every(ride=>!('stageNumber' in ride))) })
