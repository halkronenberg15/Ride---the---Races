import test from 'node:test'
import assert from 'node:assert/strict'
import { addTrainingFuel, emptyTrainingJournal, ensureHalSep30TrainingJournal, updateTrainingFeedback } from '../../packages/training-journal/src/index.ts'

test('Hal Sep 30 training journal is durable and idempotent',()=>{
  const once=ensureHalSep30TrainingJournal(emptyTrainingJournal())
  const twice=ensureHalSep30TrainingJournal(once)
  assert.equal(once.entries.length,3)
  assert.equal(twice.entries.length,3)
  const sep30=once.entries.find(entry=>entry.id==='hal-2026-09-30-climbing-endurance-75')!
  const sep29Ride=once.entries.find(entry=>entry.id==='hal-2026-09-29-endurance-60')!
  const sep29Strength=once.entries.find(entry=>entry.id==='hal-2026-09-29-strength-a')!
  assert.equal(sep30.stats.averagePowerWatts,182)
  assert.equal(sep30.fueling[0].carbohydrateGrams,17)
  assert.equal(sep30.feedback.recoveryBetweenBlocks,'FULLY_READY')
  assert.equal(sep29Ride.stats.averagePowerWatts,167)
  assert.equal(sep29Strength.strength?.completedMainWork,true)
  assert.equal(sep29Strength.strength?.exercises.find(exercise=>exercise.name==='Pallof press')?.reason?.includes('not fatigue-related'),true)
})

test('feedback updates do not erase ride stats or fueling',()=>{
  let state=ensureHalSep30TrainingJournal(emptyTrainingJournal())
  const sep30=state.entries.find(entry=>entry.id==='hal-2026-09-30-climbing-endurance-75')!
  state=updateTrainingFeedback(state,sep30.id,{legsAfter:'GOOD'})
  const updated=state.entries.find(entry=>entry.id===sep30.id)!
  assert.equal(updated.feedback.legsAfter,'GOOD')
  assert.equal(updated.stats.totalOutputKj,819)
  assert.equal(updated.fueling.length,1)
})

test('fuel entries upsert by id',()=>{
  let state=ensureHalSep30TrainingJournal(emptyTrainingJournal())
  const sep30=state.entries.find(entry=>entry.id==='hal-2026-09-30-climbing-endurance-75')!
  state=addTrainingFuel(state,sep30.id,{id:'spring-strawberry-35',minute:35,kind:'GEL',label:'Spring Energy Strawberry Smoothie',carbohydrateGrams:18})
  const updated=state.entries.find(entry=>entry.id===sep30.id)!
  assert.equal(updated.fueling.length,1)
  assert.equal(updated.fueling[0].carbohydrateGrams,18)
})
