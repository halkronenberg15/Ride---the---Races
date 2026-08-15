import assert from 'node:assert/strict'
import test from 'node:test'
import { raceIdentities, vueltaRideStages } from '../data/raceLibrary.ts'
import { raceStages } from '../data/raceStages.ts'
import { actionableStage, forwardScrollDestination } from '../utils/navigation.ts'
import { COURSE_MARKER_HEIGHT, createRoadModel } from './roadModel.ts'

test('every production race stage carries explicit audited profile geometry',()=>{
  for(const stage of [...raceStages,...vueltaRideStages]){
    assert.equal(stage.profileVerified,true,`${stage.raceId??'tour'} stage ${stage.number}`)
    assert.ok(stage.profileSource&&stage.profileReference&&stage.profileUpdatedAt)
    assert.ok(stage.profilePoints.length>=8)
    assert.notEqual(new Set(stage.profilePoints).size,1)
  }
  assert.equal(vueltaRideStages.length,21)
})

test('Monaco time trial has the corrected distance, early descent and flat late road',()=>{
  const stage=vueltaRideStages[0]
  assert.equal(stage.distanceKm,9.4)
  const points=stage.profilePoints.map(value=>typeof value==='string'?value.split(',').map(Number):[value.distanceKm/stage.distanceKm*100,value.elevationM])
  assert.ok(points.slice(1,5).some(([,y],index)=>y-(points[index]?.[1]??y)>15),'early profile descends')
  const late=points.filter(([x])=>x>=45).map(([,y])=>y)
  assert.ok(Math.max(...late)-Math.min(...late)<=4,'road after descent is predominantly flat')
  assert.deepEqual(stage.courseMarkers,[{type:'time-check',routeKm:5.6,label:'TT CHECK'}])
  assert.ok(stage.segments.every(segment=>!/sprint|climb|kom/i.test(`${segment.name} ${segment.type}`)))
})

test('time-check marker uses metadata color and approved marker geometry',()=>{
  const stage=vueltaRideStages[0]
  const model=createRoadModel(stage.number,stage.segments,stage.distanceKm,raceIdentities['vuelta-2026'],stage.profilePoints,stage.courseMarkers)
  const check=model.markers.find(marker=>marker.type==='time-check')
  assert.ok(check)
  assert.equal(check.label,'TT CHECK')
  assert.equal(check.color,raceIdentities['vuelta-2026'].timeCheckColor)
  assert.equal(check.localY-check.topY,COURSE_MARKER_HEIGHT)
  assert.ok(check.topY<check.localY)
  assert.equal(model.markers.find(marker=>marker.type==='finish')?.color,'#ffffff')
})

test('forward destinations resolve race progress without changing it',()=>{
  const tour={currentStage:9,completedStages:[1,2,3,4,5,6,7,8]}
  const vuelta={currentStage:1,completedStages:[1,2,3]}
  assert.equal(actionableStage(tour,raceStages.map(stage=>stage.number)),9)
  assert.equal(actionableStage(vuelta,[1,2,3,4,5,6,7,8,9]),4)
  assert.equal(forwardScrollDestination('roadbook'),'actionable-stage')
  assert.equal(forwardScrollDestination('briefing'),'top')
  assert.equal(forwardScrollDestination('cockpit'),'top')
  assert.deepEqual(vuelta,{currentStage:1,completedStages:[1,2,3]})
})
