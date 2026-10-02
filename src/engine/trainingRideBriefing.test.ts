import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTrainingRideBriefing } from './trainingRideBriefing.ts'
import { workoutById, workoutSections } from './adaptiveTraining40251.ts'

test('briefing explains purpose targets structure and fueling',()=>{
 const workout=workoutById('endurance-steady-75')!
 const briefing=buildTrainingRideBriefing(workout,229,workoutSections(workout))
 assert.equal(briefing.durationLabel,'75 minutes')
 assert.match(briefing.purpose,/aerobic/i)
 assert.match(briefing.targetPower,/W/)
 assert.match(briefing.structure,/Progressive warm-up/i)
 assert.match(briefing.fueling,/carbohydrate|fluid/i)
 assert.match(briefing.jeanOpening,/Steady Endurance 75/)
})
