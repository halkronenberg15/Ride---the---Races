import test from 'node:test'
import assert from 'node:assert/strict'
import { addTrainingFuel, emptyTrainingJournal, ensureHalSep30TrainingJournal, updateTrainingFeedback } from '../../packages/training-journal/src/index.ts'

test('Hal Sep 30 training journal is durable and idempotent',()=>{
  const once=ensureHalSep30TrainingJournal(emptyTrainingJournal())
  const twice=ensureHalSep30TrainingJournal(once)
  assert.equal(once.entries.length,1)
  assert.equal(twice.entries.length,1)
  assert.equal(once.entries[0].stats.averagePowerWatts,182)
  assert.equal(once.entries[0].fueling[0].carbohydrateGrams,17)
  assert.equal(once.entries[0].feedback.recoveryBetweenBlocks,'FULLY_READY')
  assert.equal(once.entries[0].coach?.progressionEvidence,'LOCAL')
})

test('feedback updates do not erase ride stats or fueling',()=>{
  let state=ensureHalSep30TrainingJournal(emptyTrainingJournal())
  state=updateTrainingFeedback(state,state.entries[0].id,{legsAfter:'GOOD'})
  assert.equal(state.entries[0].feedback.legsAfter,'GOOD')
  assert.equal(state.entries[0].stats.totalOutputKj,819)
  assert.equal(state.entries[0].fueling.length,1)
})

test('fuel entries upsert by id',()=>{
  let state=ensureHalSep30TrainingJournal(emptyTrainingJournal())
  state=addTrainingFuel(state,state.entries[0].id,{id:'spring-strawberry-35',minute:35,kind:'GEL',label:'Spring Energy Strawberry Smoothie',carbohydrateGrams:18})
  assert.equal(state.entries[0].fueling.length,1)
  assert.equal(state.entries[0].fueling[0].carbohydrateGrams,18)
})
