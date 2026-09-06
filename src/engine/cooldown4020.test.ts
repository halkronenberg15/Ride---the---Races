import assert from 'node:assert/strict'
import test from 'node:test'
import { getRaceStage } from '../data/raceStages.ts'
import { applyDurationSelection, cooldownAllocation, durationSelectionForStage, stageDurationPlan } from './durationEngine.ts'
import { createRoadModel } from './roadModel.ts'
import { completeCooldown } from './rideCompletion.ts'
import { PELOTON_BASELINE_EQUIPMENT } from './manualBike.ts'

const stage=getRaceStage(7)

test('every Stage 7 preset reserves five minutes inside the selected total',()=>{
 const plan=stageDurationPlan(stage)
 for(const mode of ['QUICK','STANDARD','RECOMMENDED','EXTENDED','EPIC'] as const){
  const selection=durationSelectionForStage(stage,{mode});const result=applyDurationSelection(stage.segments,selection)
  assert.equal(result.map.totalDurationSeconds,plan.minutes[mode]*60);assert.equal(result.map.officialDurationSeconds,plan.minutes[mode]*60)
  assert.equal(result.map.cooldownSeconds,300);assert.equal(result.map.raceDurationSeconds,(plan.minutes[mode]-5)*60)
  assert.equal(result.segments.reduce((sum,item)=>sum+item.sec,0),plan.minutes[mode]*60)
 }
})

test('Custom duration and unusually short allocations remain exact and safe',()=>{
 for(const minutes of [70,80,105]){const result=applyDurationSelection(stage.segments,{mode:'CUSTOM',customMinutes:minutes});assert.equal(result.map.totalDurationSeconds,minutes*60);assert.equal(result.map.cooldownSeconds,300)}
 assert.equal(cooldownAllocation(240),60);assert.equal(cooldownAllocation(600),120);assert.equal(cooldownAllocation(1800),300)
})

test('race reaches canonical finish before cooldown and geography stays frozen',()=>{
 const result=applyDurationSelection(stage.segments,{mode:'CUSTOM',customMinutes:105})
 const road=createRoadModel(7,result.segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,208,PELOTON_BASELINE_EQUIPMENT)
 assert.equal(road.duration,6300);assert.equal(road.raceFinishTime,6000)
 const finish=road.roadSnapshot(road.raceFinishTime),middle=road.roadSnapshot(6150),end=road.roadSnapshot(6300)
 assert.equal(finish.lifecycle,'OPTIONAL_COOLDOWN');assert.equal(finish.courseDistance,stage.distanceKm);assert.equal(finish.raceFinished,true);assert.equal(finish.stageComplete,false)
 for(const snapshot of [middle,end]){assert.equal(snapshot.courseDistance,stage.distanceKm);assert.equal(snapshot.courseProgress,1);assert.equal(snapshot.officialRaceElapsed,6000);assert.equal(snapshot.activeClimbId,null);assert.equal(snapshot.gradient,0)}
 assert.equal(end.stageComplete,true);assert.equal(end.lifecycle,'FINISHED')
})

test('cooldown recovery targets progress through the equipment resolver',()=>{
 const timed=applyDurationSelection(stage.segments,{mode:'CUSTOM',customMinutes:105}).segments
 const road=createRoadModel(7,timed,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,208,PELOTON_BASELINE_EQUIPMENT)
 const start=road.roadSnapshot(road.raceFinishTime+.01),end=road.roadSnapshot(road.duration-.01)
 assert.equal(start.livePrescription.zone,'RECOVERY');assert.equal(end.livePrescription.zone,'RECOVERY')
 assert.ok(start.livePrescription.powerRange.max>end.livePrescription.powerRange.max)
 assert.notEqual(start.livePrescription.manualTarget.feasibility,'UNAVAILABLE')
})

test('Skip cooldown and End cooldown preserve frozen official time and separate recovery metrics',()=>{
 assert.deepEqual(completeCooldown(6000,6300,6000,true),{officialRaceDurationSeconds:6000,cooldownDurationSeconds:0,cooldownSkipped:true})
 assert.deepEqual(completeCooldown(6000,6300,6123,false),{officialRaceDurationSeconds:6000,cooldownDurationSeconds:123,cooldownSkipped:false})
 assert.deepEqual(completeCooldown(6000,6300,9999,false),{officialRaceDurationSeconds:6000,cooldownDurationSeconds:300,cooldownSkipped:false})
})

test('Stage 7 authored Sprint and KOM retain category, points, order, and selected-time projection',()=>{
 const timed=applyDurationSelection(stage.segments,{mode:'CUSTOM',customMinutes:70}).segments
 const road=createRoadModel(7,timed,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId)
 const markers=road.markers.filter(item=>item.type==='sprint'||item.type==='kom')
 assert.deepEqual(markers.map(item=>item.type),['sprint','kom']);assert.deepEqual(markers.map(item=>item.points),[20,1]);assert.equal(markers[1].category,'Cat 4')
 assert.ok(markers.every(marker=>marker.at<road.raceFinishTime));assert.ok(markers[0].routeKm<markers[1].routeKm)
})
