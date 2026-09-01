import assert from 'node:assert/strict'
import test from 'node:test'
import { tour2026, toRaceStage, vuelta2026 } from '../data/professionalRaces.ts'
import { trainingRides } from '../data/raceLibrary.ts'
import { createRoadModel } from './roadModel.ts'
import { createJeanEvent, isJeanEventContextValid } from './jeanEvents.ts'

const stage9=toRaceStage(tour2026,tour2026.stages[8])
const stage9Road=createRoadModel(9,stage9.segments,stage9.distanceKm,undefined,stage9.profilePoints)

test('Alpha 4.0.11 Stage 9 27–30% region uses canonical piecewise distance',()=>{
 const states=[.25,.27,.30].map(progress=>stage9Road.roadSnapshot(stage9Road.duration*progress))
 states.forEach((state,index)=>{
  assert.equal(state.roadPosition,state.courseDistance/stage9.distanceKm)
  assert.equal(state.profileY,92-(state.elevation-Math.min(...stage9Road.points.map(p=>p.elevation)))/Math.max(1,Math.max(...stage9Road.points.map(p=>p.elevation))-Math.min(...stage9Road.points.map(p=>p.elevation)))*80)
  if(index)assert.ok(state.courseDistance>=states[index-1].courseDistance)
 })
 assert.ok(states[1].courseProgress<states[2].courseProgress)
 assert.equal(states[1].segment.name,'Corrèze Tempo')
})

test('Stage 9 climb entry, summit geometry, ETA and Jean crossing are one coordinate',()=>{
 const profile=stage9.profilePoints.filter((point):point is {distanceKm:number;elevationM:number}=>typeof point!=='string')
 const risingIndex=profile.findIndex((point,index)=>index>0&&profile[index+1]?.elevationM>point.elevationM&&profile[index-1].elevationM>=point.elevationM)
 const start=profile[risingIndex].distanceKm
 let summitIndex=risingIndex+1
 while(profile[summitIndex+1]?.elevationM>profile[summitIndex].elevationM)summitIndex+=1
 const summit=profile[summitIndex].distanceKm
 const startTime=stage9Road.elapsedAtCourseDistance(start)
 const summitTime=stage9Road.elapsedAtCourseDistance(summit)
 const before=stage9Road.roadSnapshot(startTime-.001),entry=stage9Road.roadSnapshot(startTime)
 const middle=stage9Road.roadSnapshot((startTime+summitTime)/2)
 const almost=stage9Road.roadSnapshot(summitTime-.001),at=stage9Road.roadSnapshot(summitTime),after=stage9Road.roadSnapshot(summitTime+.001)
 assert.equal(before.activeClimbId,null); assert.equal(entry.climbProgress,0)
 assert.ok(middle.climbProgress>0&&middle.climbProgress<1); assert.ok(middle.distanceToSummit>0)
 assert.equal(middle.gradient,middle.gradientSections[middle.gradientIndex].gradient)
 assert.equal(middle.nextGradient,middle.gradientSections.slice(middle.gradientIndex+1).find(section=>section.gradient>0)?.gradient??null)
 assert.ok(middle.roadPosition<summit/stage9.distanceKm)
 assert.ok(almost.distanceToSummit>0&&almost.roadPosition<summit/stage9.distanceKm)
 assert.equal(at.distanceToSummit,0); assert.equal(at.roadPosition,summit/stage9.distanceKm); assert.equal(at.climbProgress,1)
 assert.ok(after.roadPosition>at.roadPosition); assert.equal(after.activeClimbId,null)
 assert.ok(almost.estimatedTimeToSummit>0&&at.estimatedTimeToSummit===0)
 const summitCall=createJeanEvent('stage9-summit','coaching','Push over the summit')
 assert.equal(isJeanEventContextValid(summitCall,{courseDistance:almost.courseDistance,activeClimbId:almost.activeClimbId,summitDistance:almost.summitDistance,climbProgress:almost.climbProgress}),true)
 assert.equal(isJeanEventContextValid(summitCall,{courseDistance:at.courseDistance,activeClimbId:at.activeClimbId,summitDistance:at.summitDistance,climbProgress:at.climbProgress}),false)
 assert.equal(isJeanEventContextValid(summitCall,{courseDistance:after.courseDistance,activeClimbId:after.activeClimbId,summitDistance:after.summitDistance,climbProgress:after.climbProgress}),false)
 const debug=stage9Road.debugSnapshot((startTime+summitTime)/2)
 assert.equal(debug.courseDistance,middle.courseDistance); assert.equal(debug.summitDistance,summit)
})

test('canonical mapping spans professional race types and training fallback without namespace leakage',()=>{
 const professionalStages=[tour2026.stages[5],tour2026.stages[6],tour2026.stages[15],vuelta2026.stages[0],vuelta2026.stages[7]]
 for(const source of professionalStages){
  const stage=toRaceStage(source===vuelta2026.stages[0]||source===vuelta2026.stages[7]?vuelta2026:tour2026,source)
  const road=createRoadModel(stage.number,stage.segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers)
  assert.equal(road.profileSourceKind,'authoritative')
  let prior=-1
  for(let elapsed=0;elapsed<=road.duration;elapsed+=Math.max(1,road.duration/20)){
   const snapshot=road.roadSnapshot(elapsed); assert.ok(snapshot.courseDistance>=prior); prior=snapshot.courseDistance
  }
  assert.equal(road.roadSnapshot(road.duration).courseDistance,stage.distanceKm)
  assert.ok(road.actionTargets(1).current)
 }
 const training=trainingRides[0].stage
 const road=createRoadModel(0,training.segments,training.distanceKm)
 assert.equal(road.profileSourceKind,'generated-fallback')
 assert.equal(road.roadSnapshot(10).courseDistance,road.roadSnapshot(10).courseDistance,'pause freezes the pure resolver')
 assert.ok(road.roadSnapshot(11).courseDistance>=road.roadSnapshot(10).courseDistance)
})
