import test from 'node:test'
import assert from 'node:assert/strict'
import { getLibraryStage } from '../data/raceLibrary.ts'
import { adaptSegments } from './adaptiveRide.ts'
import { applyDurationSelection, durationSelectionForStage } from './durationEngine.ts'
import { createRoadModel } from './roadModel.ts'
import { canonicalCoursePosition, mobileGradientWindow } from './alpha4023.ts'
import { GENERIC_MANUAL_EQUIPMENT } from './manualBike.ts'
import { ftpIntensity } from './prescription.ts'
import { gradientDifficultyColor, mergeMeaningfulGradientSections } from './gradientRoad.ts'

const stage=getLibraryStage('vuelta-2026',9)!
function fixture(minutes:90|112){
 const adapted=adaptSegments(stage.segments,206,'Balanced')
 const selection=durationSelectionForStage(stage,{mode:minutes===112?'RECOMMENDED':'CUSTOM',customMinutes:minutes})
 const segments=applyDurationSelection(adapted,selection).segments
 return {segments,model:createRoadModel(stage.number,segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,206,GENERIC_MANUAL_EQUIPMENT)}
}

test('Stage 9 geography is invariant at 90 and 112 minutes',()=>{
 const short=fixture(90),recommended=fixture(112)
 assert.deepEqual(short.model.climbs,recommended.model.climbs)
 assert.equal(short.model.distanceKm,stage.distanceKm)
 assert.equal(recommended.model.distanceKm,stage.distanceKm)
 assert.equal(short.model.raceFinishTime,90*60-short.segments.at(-1)!.sec)
 assert.equal(recommended.model.raceFinishTime,112*60-recommended.segments.at(-1)!.sec)
})

test('canonical completion cannot reach 100 before distance zero',()=>{
 for(const minutes of [90,112] as const){const {model}=fixture(minutes);const before=canonicalCoursePosition(model,model.raceFinishTime-.1);assert.ok(before.completion<100);assert.ok(before.remainingDistance>0);const finish=canonicalCoursePosition(model,model.raceFinishTime);assert.equal(finish.completion,100);assert.equal(finish.remainingDistance,0);assert.equal(finish.fullProfileCoordinate,1)}
})

test('climb metrics share the course coordinate and agree exactly at summit',()=>{
 const {model}=fixture(112);assert.ok(model.climbs.length)
 for(const climb of model.climbs){const entrance=model.elapsedAtCourseDistance(climb.startDistance);const before=canonicalCoursePosition(model,Math.max(0,entrance-.01));assert.equal(before.climbCompletion,null);const middle=canonicalCoursePosition(model,model.elapsedAtCourseDistance((climb.startDistance+climb.summitDistance)/2));assert.ok((middle.climbCompletion??0)>0);assert.ok((middle.distanceToSummit??0)>0);const summit=canonicalCoursePosition(model,model.elapsedAtCourseDistance(climb.summitDistance));assert.equal(summit.climbCompletion,100);assert.equal(summit.distanceToSummit,0);assert.equal(summit.timeToSummit,0)}
})

test('distance and summit time decrease monotonically on Aitana climbs',()=>{
 const {model}=fixture(112);const climb=model.climbs.at(-1)!;let lastDistance=Infinity,lastTime=Infinity
 for(let step=0;step<=20;step++){const km=climb.startDistance+(climb.summitDistance-climb.startDistance)*step/20;const state=canonicalCoursePosition(model,model.elapsedAtCourseDistance(km));assert.ok((state.distanceToSummit??0)<=lastDistance+1e-7);assert.ok((state.timeToSummit??0)<=lastTime+1e-7);lastDistance=state.distanceToSummit??0;lastTime=state.timeToSummit??0}
})

test('Up Next exposes the next full scaled duration throughout current section',()=>{
 for(const minutes of [90,112] as const){const {model,segments}=fixture(minutes);const start=model.segmentStarts[2];for(const offset of [0,segments[2].sec/2,segments[2].sec-1]){const state=canonicalCoursePosition(model,start+offset);assert.equal(state.nextTargets?.remaining,segments[3].sec)}}
})

test('Aitana Summit Drive has a nonzero feasible resolver anchor',()=>{
 const segment=stage.segments.find(item=>item.name==='Aitana Summit Drive')!;const intensity=ftpIntensity(segment)!;assert.ok(intensity.min>=100);assert.ok(intensity.max>=intensity.min)
 const {model}=fixture(112);const index=model.snapshot(0).segment.name?fixture(112).segments.findIndex(item=>item.name===segment.name):-1;const prescription=model.roadSnapshot(model.segmentStarts[index]+1).livePrescription;assert.doesNotMatch(prescription.power,/^0[–-]/);assert.notEqual(prescription.manualTarget.resolvedExactResistance,0)
})

test('gradient palette and noise merge follow Alpha 4.0.23 rules',()=>{
 assert.deepEqual([2.9,3,6,9,12].map(gradientDifficultyColor),['#29a35a','#2374d8','#e67922','#d73535','#310811'])
 assert.equal(mergeMeaningfulGradientSections([{start:0,end:.2,gradient:5},{start:.2,end:.4,gradient:5.4},{start:.4,end:1,gradient:7}]).length,2)
 assert.ok(mobileGradientWindow(Array.from({length:8},(_,i)=>({start:i/8,end:(i+1)/8,gradient:i})),5).sections.length<=5)
})
