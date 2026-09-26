import test from 'node:test'
import assert from 'node:assert/strict'
import { canSwitchRideSetting, changePlannedRide, generatePlan, HAL_GOALS, HAL_INPUT, movePlannedRide, switchRideSetting, validatePlanConstraints } from './alpha4025.ts'
import { outdoorWorkoutSnapshot, startOutdoorRide, completeOutdoorRide } from './outdoorRide40252.ts'
import { nextOutdoorJeanCue, outdoorJeanCues } from './outdoorJean40252.ts'
import { emptyAlpha4025 } from './alpha4025.ts'
import { getLibraryStage } from '../data/raceLibrary.ts'

test('24-week plan keeps 10-hour regular weeks, two strength sessions and the late back-to-back progression',()=>{
 const initial=generatePlan(HAL_INPUT,HAL_GOALS)
 assert.equal(initial.weeks.length,24)
 for(const week of initial.weeks.filter(w=>!w.recoveryWeek)){
  assert.equal(week.assignments.reduce((sum,a)=>sum+a.durationMinutes,0),600)
  assert.equal(week.assignments.filter(a=>a.type==='STRENGTH').length,2)
 }
 const peak=initial.weeks[20]
 assert.equal(peak.assignments.find(a=>a.day==='Saturday'&&a.type==='CYCLING')?.durationMinutes,270)
 assert.equal(peak.assignments.find(a=>a.day==='Sunday'&&a.type==='CYCLING')?.durationMinutes,240)
 assert.equal(peak.assignments.filter(a=>a.type==='STRENGTH').reduce((sum,a)=>sum+a.durationMinutes,0),45)
 assert.ok(initial.weeks[3].assignments.reduce((sum,a)=>sum+a.durationMinutes,0)<600)
 assert.deepEqual(initial.weeks.filter(w=>w.recoveryWeek).map(w=>w.number),[4,8,12,16,20,24])
 assert.equal(validatePlanConstraints(initial,6,600).length,0)
 const weekOne=initial.weeks[0]
 const tuesdayDate=weekOne.assignments.find(a=>a.day==='Tuesday'&&a.type==='CYCLING')!.date
 assert.deepEqual(weekOne.assignments.filter(a=>a.date===tuesdayDate).map(a=>a.type).sort(),['CYCLING','STRENGTH'])
 const previous=generatePlan({...HAL_INPUT,weeklyDays:4,weeklyMinutes:240},{...HAL_GOALS,weeklyDays:4,weeklyMinutes:240})
 previous.weeks[0].assignments[2]={...previous.weeks[0].assignments[2],status:'COMPLETED',completion:{completedAt:'2026-09-23',durationMinutes:45}}
 const updated=generatePlan(HAL_INPUT,HAL_GOALS,previous)
 assert.equal(updated.weeks[0].assignments.find(a=>a.id==='w1-d3')?.status,'COMPLETED')
 assert.equal(updated.weeks[0].assignments.find(a=>a.day==='Saturday'&&a.type==='CYCLING')?.id,'w1-d6')
})

test('switching an endurance ride keeps date, duration, purpose and effort while opening the right cockpit',()=>{
 const plan=generatePlan(HAL_INPUT,HAL_GOALS),outdoor=plan.weeks[1].assignments[5]
 assert.ok(canSwitchRideSetting(outdoor))
 const indoor=switchRideSetting(plan,outdoor.id),changed=indoor.weeks[1].assignments[5]
 assert.equal(changed.date,outdoor.date)
 assert.equal(changed.durationMinutes,outdoor.durationMinutes)
 assert.equal(changed.purpose,outdoor.purpose)
 assert.equal(changed.effort,outdoor.effort)
 assert.equal(changed.workoutId,'indoor-endurance-120')
 assert.equal(getLibraryStage('training',0,changed.workoutId)?.segments.reduce((sum,s)=>sum+s.sec,0),7200)
 const trainingStage=getLibraryStage('training',0,changed.workoutId)!,raceStage=getLibraryStage('tour-2026',1)!
 assert.equal(trainingStage.raceId,'training')
 assert.equal(trainingStage.isTraining,true)
 assert.deepEqual(trainingStage.profilePoints,raceStage.profilePoints)
 assert.match(trainingStage.teamOrders.join(' '),/does not count as a race stage/)
 assert.equal(validatePlanConstraints(indoor,6,600).length,0)
 assert.equal(switchRideSetting(indoor,outdoor.id).weeks[1].assignments[5].workoutId,outdoor.workoutId)
 assert.throws(()=>switchRideSetting(plan,'w1-d3'),/unfinished endurance/)
})

test('an unfinished ride can move within its week or become a shorter workout without stacking',()=>{
 const plan=generatePlan(HAL_INPUT,HAL_GOALS),original=plan.weeks[1].assignments[5]
 const moved=movePlannedRide(plan,original.id,plan.weeks[1].assignments[0].date)
 assert.equal(moved.weeks[1].assignments[5].id,original.id)
 assert.equal(moved.weeks[1].assignments[5].day,'Monday')
 assert.equal(moved.weeks[1].assignments[0].day,'Saturday')
 assert.equal(validatePlanConstraints(moved,6,600).length,0)
 const changed=changePlannedRide(plan,original.id,'endurance-steady-75',206)
 assert.equal(changed.weeks[1].assignments.length,9)
 assert.equal(changed.weeks[1].assignments[5].workoutId,'endurance-steady-75')
 assert.throws(()=>movePlannedRide(plan,original.id,plan.weeks[2].assignments[0].date),/same week/)
})

test('120-minute outdoor session reaches cooldown and completion at 120 minutes with no 90-minute finish cue',()=>{
 assert.equal(outdoorWorkoutSnapshot(5400,120).complete,false)
 assert.equal(outdoorWorkoutSnapshot(6600,120).current.title,'Cooldown')
 assert.equal(outdoorWorkoutSnapshot(7200,120).complete,true)
 assert.notEqual(nextOutdoorJeanCue(5400,[],120).cue?.id,'finish')
 assert.equal(outdoorWorkoutSnapshot(270*60,270).complete,true)
 assert.notEqual(nextOutdoorJeanCue(120*60,[],270).cue?.id,'finish')
 assert.deepEqual(outdoorJeanCues(270).filter(c=>c.id.startsWith('fuel-')).map(c=>c.atSeconds/60),[35,65,95,125,155,185,215,245])
 const plan=generatePlan(HAL_INPUT,HAL_GOALS),assignment=plan.weeks[1].assignments[5],ride=startOutdoorRide(assignment.id,1000)
 const state=completeOutdoorRide({...emptyAlpha4025(),trainingPlan:plan},ride,{durationSeconds:7200},'2026-10-03T18:00:00Z')
 assert.equal(state.trainingPlan?.weeks[1].assignments[5].status,'COMPLETED')
})
