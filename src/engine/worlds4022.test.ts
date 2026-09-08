import assert from 'node:assert/strict'
import test from 'node:test'
import { WORLDS_DURATIONS, worldsStage } from '../data/uciWorlds2026.ts'
import { activeRaceSituation, circuitProgressToLap, montrealRoadStory, returnMultiplier } from './alpha4022.ts'
import { createRoadModel } from './roadModel.ts'
import { raceIdentities } from '../data/raceLibrary.ts'

test('Worlds duration variants drive one monotonic canonical road',()=>{for(const [kind,durations] of [['itt',WORLDS_DURATIONS.itt],['road',WORLDS_DURATIONS.road]] as const)for(const minutes of durations){const stage=worldsStage(kind,minutes),model=createRoadModel(stage.number,stage.segments,stage.distanceKm,raceIdentities['worlds-2026'],stage.profilePoints,stage.officialCourseMarkers,stage.raceId);assert.equal(model.duration,minutes*60);let prior=-1;for(let at=0;at<=model.duration;at+=5){const position=model.roadSnapshot(at).courseProgress;assert(position>=prior);prior=position}}})
test('ITT renders authored split markers and no competition markers',()=>{const stage=worldsStage('itt'),model=createRoadModel(1,stage.segments,stage.distanceKm,raceIdentities['worlds-2026'],stage.profilePoints,stage.officialCourseMarkers,stage.raceId);assert.deepEqual(model.markers.filter(m=>m.type==='time-check').map(m=>m.label),['SPLIT 1','SPLIT 2','SPLIT 3','SPLIT 4']);assert.equal(model.markers.some(m=>m.type==='sprint'||m.type==='kom'),false)})
test('story is isolated and deterministic',()=>{assert.equal(activeRaceSituation('tour-2026',.3),undefined);assert.equal(activeRaceSituation('worlds-2026',.3)?.id,'mtl-approach-chase');assert.equal(montrealRoadStory.length,8)})
test('lap mapping reaches every lap in order',()=>{assert.deepEqual(Array.from({length:12},(_,i)=>circuitProgressToLap(.41+(i+.01)*.56/12)),Array.from({length:12},(_,i)=>i+1))})
test('return transition reaches exact base only after 45 active seconds',()=>{assert(returnMultiplier(0)>returnMultiplier(20));assert.equal(returnMultiplier(45),1)})
