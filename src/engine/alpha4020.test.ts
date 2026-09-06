import assert from 'node:assert/strict'
import test from 'node:test'
import { getRaceStage } from '../data/raceStages.ts'
import { applyDurationSelection } from './durationEngine.ts'
import { createRoadModel } from './roadModel.ts'
import { PELOTON_BASELINE_EQUIPMENT } from './manualBike.ts'
import { applyTacticalAction, availableTacticalActions, resolveTacticalTransition, TACTICAL_STATES } from './tacticalActions.ts'
import { captionDurationMs, enqueueRadio } from './teamRadio.ts'
import { migrateCareer } from '../state/careerPersistence.ts'

test('Stage 7 canonical checkpoints stay monotonic and all projections are bounded at 70, 80, and 105 minutes',()=>{
 const stage=getRaceStage(7)
 for(const minutes of [70,80,105]){
  const segments=applyDurationSelection(stage.segments,{mode:'CUSTOM',customMinutes:minutes}).segments
  const road=createRoadModel(7,segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,208,PELOTON_BASELINE_EQUIPMENT)
  let distance=0,progress=0
  const checkpoints=new Set([0,road.duration,...road.segmentStarts,...road.markers.map(marker=>marker.at)])
  for(let at=0;at<=road.duration;at+=15)checkpoints.add(at)
  for(const at of [...checkpoints].sort((a,b)=>a-b)){
   const snap=road.roadSnapshot(at);assert.ok(snap.courseDistance>=distance-1e-8);assert.ok(snap.courseProgress>=progress-1e-8)
   assert.ok(snap.estimatedTimeToSummit<=snap.stageRemaining+1e-8)
   assert.equal(snap.roadPosition,snap.courseProgress);assert.equal(snap.routeDistanceKm,snap.courseDistance)
   if(snap.livePrescription.manualTarget.resolvedExactResistance!==null){const range=snap.livePrescription.resistanceRange;assert.ok(range.max-range.min<=3);assert.ok(range.min<=snap.livePrescription.manualTarget.resolvedExactResistance&&range.max>=snap.livePrescription.manualTarget.resolvedExactResistance)}
   distance=snap.courseDistance;progress=snap.courseProgress
  }
 }
})

test('tactical return is contextual, progressive, deterministic, and geography-free',()=>{
 for(const state of TACTICAL_STATES.filter(state=>state!=='PELOTON'&&state!=='RETURNING_TO_PELOTON'))assert.ok(availableTacticalActions(state,true).includes('RETURN_TO_PELOTON'))
 const started=applyTacticalAction('BREAKAWAY','RETURN_TO_PELOTON',100);assert.equal(started.state,'RETURNING_TO_PELOTON')
 const halfway=resolveTacticalTransition(started.state,started.transition,122.5);assert.equal(halfway.state,'RETURNING_TO_PELOTON');assert.equal(halfway.transition?.progress,.5)
 assert.equal(resolveTacticalTransition(started.state,started.transition,145).state,'PELOTON')
})

test('Team Radio timing, priority queue, and v3 career migration are safe',()=>{
 assert.equal(captionDurationMs('Short message'),6000);assert.ok(captionDurationMs('word '.repeat(40))<=10000)
 const coaching={id:'c',text:'Coach',priority:'coaching' as const,createdAt:'2026-01-01'};const safety={id:'s',text:'Stop',priority:'safety' as const,createdAt:'2026-01-02'}
 assert.deepEqual(enqueueRadio([coaching],safety).map(item=>item.id),['s','c'])
 const migrated=migrateCareer({schemaVersion:3} as never);assert.equal(migrated.schemaVersion,4);assert.deepEqual(migrated.alpha4020.earnedMarkerIds,[])
})
