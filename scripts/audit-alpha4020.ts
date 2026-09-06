import assert from 'node:assert/strict'
import { getRaceStage } from '../src/data/raceStages.ts'
import { applyDurationSelection } from '../src/engine/durationEngine.ts'
import { createRoadModel } from '../src/engine/roadModel.ts'
const stage=getRaceStage(7)
for(const minutes of [70,80,105]){const timed=applyDurationSelection(stage.segments,{mode:'CUSTOM',customMinutes:minutes});const road=createRoadModel(7,timed.segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,208);assert.equal(road.duration,minutes*60);assert.equal(road.duration-road.raceFinishTime,300);let prior=0;for(let second=0;second<=road.duration;second++){const snapshot=road.roadSnapshot(second);assert.ok(snapshot.courseDistance>=prior);assert.ok(snapshot.estimatedTimeToSummit<=snapshot.stageRemaining);if(second>=road.raceFinishTime)assert.equal(snapshot.courseDistance,stage.distanceKm);prior=snapshot.courseDistance}assert.equal(road.roadSnapshot(road.duration).courseProgress,1)}
console.log('Alpha 4.0.20 canonical synchronization audit passed for Stage 7 at 70, 80, and 105 minutes.')
