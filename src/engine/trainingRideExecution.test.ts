import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRideExecutionSummary, rideExecutionSnapshot, transitionCue } from './trainingRideExecution.ts'
import type { ExecutableWorkoutSection } from './adaptiveTraining40251.ts'

const sections:ExecutableWorkoutSection[]=[
 {id:'warm',title:'Warm-up',durationSeconds:60,zone:'Recovery',ftpRange:[.4,.6],rpe:'Easy',cadence:[80,90],resistance:'Light',jean:'Warm up'},
 {id:'work',title:'Work',durationSeconds:120,zone:'Endurance',ftpRange:[.6,.7],rpe:'Steady',cadence:[80,90],resistance:'Steady',jean:'Hold'},
]

test('snapshot advances sections at exact boundary',()=>{
 const before=rideExecutionSnapshot(sections,59)
 assert.equal(before.current.id,'warm')
 assert.equal(before.sectionRemainingSeconds,1)
 const after=rideExecutionSnapshot(sections,60)
 assert.equal(after.current.id,'work')
 assert.equal(after.sectionRemainingSeconds,120)
})

test('summary distinguishes partial from complete',()=>{
 const partial=buildRideExecutionSummary({workoutId:'x',sections,activeSeconds:90,pauseCount:1,rpe:6,legsAfter:'GOOD'})
 assert.equal(partial.outcome,'PARTIAL')
 assert.equal(partial.completionPercentage,50)
 assert.deepEqual(partial.completedSectionIds,['warm'])
 const complete=buildRideExecutionSummary({workoutId:'x',sections,activeSeconds:180,pauseCount:0})
 assert.equal(complete.outcome,'COMPLETED')
 assert.equal(complete.completionPercentage,100)
})

test('transition cues stay quiet for steady work and brace hard work',()=>{
 assert.equal(transitionCue(60,'Work','Endurance'),null)
 assert.equal(transitionCue(30,'Work','Endurance'),'Thirty seconds. Work next.')
 assert.equal(transitionCue(10,'Work','Endurance'),null)
 assert.equal(transitionCue(30,'Threshold block','Threshold'),'Thirty seconds. Threshold block next.')
 assert.equal(transitionCue(10,'Threshold block','Threshold'),'Ten seconds. Get ready for Threshold block.')
 assert.equal(transitionCue(29,'Work','Endurance'),null)
})
