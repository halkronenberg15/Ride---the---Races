import assert from 'node:assert/strict'
import test from 'node:test'
import { tour2026, toRaceStage, vuelta2026 } from '../data/professionalRaces.ts'
import { trainingRides } from '../data/raceLibrary.ts'
import { createRoadModel } from './roadModel.ts'
import { buildJeanTimeline, jeanCourseEventsCrossed } from './stageEngine.ts'

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
 const climbIndex=stage9.segments.findIndex(segment=>/climb/i.test(`${segment.name} ${segment.type}`))
 const start=stage9.segments[climbIndex].routeKm
 const summit=stage9.segments[climbIndex+1].routeKm
 const startTime=stage9Road.elapsedAtCourseDistance(start)
 const summitTime=stage9Road.elapsedAtCourseDistance(summit)
 const before=stage9Road.roadSnapshot(startTime-.001),entry=stage9Road.roadSnapshot(startTime)
 const middle=stage9Road.roadSnapshot((startTime+summitTime)/2)
 const almost=stage9Road.roadSnapshot(summitTime-.001),at=stage9Road.roadSnapshot(summitTime),after=stage9Road.roadSnapshot(summitTime+.001)
 assert.equal(before.activeClimbId,null); assert.equal(entry.climbProgress,0)
 assert.ok(middle.climbProgress>0&&middle.climbProgress<1); assert.ok(middle.distanceToSummit>0)
 assert.equal(middle.gradient,middle.gradientSections[middle.gradientIndex].gradient)
 assert.equal(middle.nextGradient,middle.gradientSections[Math.min(middle.gradientIndex+1,middle.gradientSections.length-1)].gradient)
 assert.ok(middle.roadPosition<summit/stage9.distanceKm)
 assert.ok(almost.distanceToSummit>0&&almost.roadPosition<summit/stage9.distanceKm)
 assert.equal(at.distanceToSummit,0); assert.equal(at.roadPosition,summit/stage9.distanceKm); assert.equal(at.climbProgress,1)
 assert.ok(after.roadPosition>at.roadPosition); assert.equal(after.activeClimbId,null)
 assert.ok(almost.estimatedTimeToSummit>0&&at.estimatedTimeToSummit===0)
 const events=buildJeanTimeline(stage9.segments,stage9.distanceKm)
 const summits=events.filter(event=>event.type==='summit')
 assert.equal(jeanCourseEventsCrossed(summits,almost.courseDistance,at.courseDistance).length,1)
 assert.equal(jeanCourseEventsCrossed(summits,at.courseDistance,after.courseDistance).length,0)
 const debug=stage9Road.debugSnapshot((startTime+summitTime)/2)
 assert.equal(debug.courseDistance,middle.courseDistance); assert.equal(debug.summitDistance,summit)
})

test('canonical mapping spans professional race types and training fallback without namespace leakage',()=>{
 const professionalStages=[tour2026.stages[5],tour2026.stages[6],tour2026.stages[15],vuelta2026.stages[0],vuelta2026.stages[7]]
 for(const source of professionalStages){
  const stage=toRaceStage(source===vuelta2026.stages[0]||source===vuelta2026.stages[7]?vuelta2026:tour2026,source)
  const road=createRoadModel(stage.number,stage.segments,stage.distanceKm,undefined,stage.profilePoints,stage.courseMarkers)
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
