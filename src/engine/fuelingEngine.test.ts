import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateFueling } from './fuelingEngine.ts'

test('fueling engine protects ride fuel during weight loss',()=>{
 const result=evaluateFueling({weightKg:100,goalLowKg:82,goalHighKg:86,trainingMinutes:75,rideMinutes:75,demanding:false,tomorrowTrainingMinutes:60})
 assert.equal(result.dayClass,'RIDE')
 assert.equal(result.weightPhase,'WEIGHT LOSS')
 assert.ok(result.guidance.some(item=>item.includes('deficit away from the workout')))
 assert.deepEqual(result.proteinTargetG,[160,200])
 assert.deepEqual(result.carbTargetG,[300,500])
})

test('fueling engine switches to maintenance in goal range',()=>{
 const result=evaluateFueling({weightKg:84,goalLowKg:82,goalHighKg:86,trainingMinutes:0,rideMinutes:0,demanding:false})
 assert.equal(result.weightPhase,'GOAL RANGE')
 assert.equal(result.dayClass,'RECOVERY')
})
