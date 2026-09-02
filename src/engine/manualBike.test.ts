import assert from 'node:assert/strict'
import test from 'node:test'
import { ManualResistanceAnnouncementGate, PELOTON_MANUAL_PROFILE, calibrationSampleFromStableWindow, estimateBikePower, inverseResistanceForPower, resolveVirtualRoadLoad, translateManualRoadFeel } from './manualBike.ts'
import { applyTerrainModifier } from './terrainModifier.ts'
import { resolvePrescriptionAtState } from './prescription.ts'
import { createStageTimeline } from './stageEngine.ts'
import { toRaceStage, vuelta2026 } from '../data/professionalRaces.ts'
import { adaptSegments } from './adaptiveRide.ts'
import { applyDurationSelection, durationSelectionForStage } from './durationEngine.ts'
import { createRoadModel, type RoadSnapshot } from './roadModel.ts'

const stage=toRaceStage(vuelta2026,vuelta2026.stages[5])
const gradients=[-8,-4,-1,0,2,4,6,9,12,15]

test('manual road feel matrix is deterministic, bounded and terrain-led',()=>{
 const segments=adaptSegments(stage.segments,208,'Balanced');const timeline=createStageTimeline(segments,stage.distanceKm);const prescription=resolvePrescriptionAtState(segments,timeline.segmentStarts,800).currentPrescription
 const states=gradients.map(gradient=>applyTerrainModifier(prescription,gradient,gradient<0?'descent':gradient>2?'climb':'flat',208))
 assert.deepEqual(states,gradients.map(gradient=>applyTerrainModifier(prescription,gradient,gradient<0?'descent':gradient>2?'climb':'flat',208)))
 assert.ok(states.every(state=>state.manualResistanceTarget>=0&&state.manualResistanceTarget<=100&&state.powerRange.max<=208*state.ftpPercent.max/100+1e-9))
 for(let index=1;index<states.length;index++)assert.ok(states[index].manualResistanceTarget>=states[index-1].manualResistanceTarget)
 assert.ok(states[0].manualResistanceTarget<states[3].manualResistanceTarget&&states[1].cadenceRange.min>=90)
})

test('device profile preserves aggregate provenance and stable telemetry boundary',()=>{
 assert.equal(PELOTON_MANUAL_PROFILE.calibrationConfidence,'BASELINE');assert.ok(PELOTON_MANUAL_PROFILE.calibrationSamples.every(sample=>sample.sourceType==='historical-average'&&sample.aggregate&&sample.confidence==='LOW'))
 const power=estimateBikePower(PELOTON_MANUAL_PROFILE,44,88);assert.ok(power>0);assert.ok(inverseResistanceForPower(PELOTON_MANUAL_PROFILE,power,88)>=0)
 const start=Date.UTC(2026,0,1);const sample=calibrationSampleFromStableWindow({samples:[0,5000,10000,15000].map((offset,index)=>({timestamp:start+offset,resistance:44,cadence:88+index%2,power:166+index%2})),minimumDurationSeconds:10,maximumVariation:{resistance:1,cadence:2,power:5}})
 assert.equal(sample?.sourceType,'live-telemetry');assert.equal(sample?.confidence,'HIGH');assert.equal(sample?.aggregate,false)
})

test('Alcossebre 80 and 105 minute maps share geography and switch road load at summits',()=>{
 const adapted=adaptSegments(stage.segments,208,'Balanced');const models=[{mode:'STANDARD' as const,minutes:80},{mode:'RECOMMENDED' as const,minutes:105}].map(item=>{const selection=durationSelectionForStage(stage,{mode:item.mode});const timed=applyDurationSelection(adapted,selection);assert.equal(timed.map.officialDurationSeconds,item.minutes*60);return createRoadModel(stage.number,timed.segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,208)})
 assert.deepEqual(models[0].profilePoints,models[1].profilePoints);assert.deepEqual(models[0].markers.map(marker=>[marker.type,marker.position]),models[1].markers.map(marker=>[marker.type,marker.position]))
 const positions=[0,6.5,12.999,13,13.001,20,27]
 for(const km of positions){const states=models.map(model=>model.roadSnapshot(model.elapsedAtCourseDistance(km)));assert.ok(Math.abs(states[0].courseDistance-states[1].courseDistance)<1e-9);assert.equal(states[0].gradient,states[1].gradient);assert.ok(Math.abs(states[0].elevation-states[1].elevation)<1e-9);assert.equal(states[0].climbStartDistance,states[1].climbStartDistance);assert.equal(states[0].summitDistance,states[1].summitDistance);assert.equal(states[0].livePrescription.manualResistanceTarget,states[1].livePrescription.manualResistanceTarget)}
 for(const model of models){const climb=model.roadSnapshot(model.elapsedAtCourseDistance(12.999));const summit=model.roadSnapshot(model.elapsedAtCourseDistance(13));const descent=model.roadSnapshot(model.elapsedAtCourseDistance(13.001));assert.equal(climb.segment.name,'First Coastal Climb');assert.equal(summit.nextGradient,null);assert.equal(descent.segment.name,'First Descent Reset');assert.equal(descent.activeClimbId,null);assert.ok(descent.livePrescription.manualResistanceTarget<climb.livePrescription.manualResistanceTarget)}
})

test('road feel scaling leaves official gradient visible while changing felt load',()=>{const full=resolveVirtualRoadLoad(10);const comfortable=resolveVirtualRoadLoad(10,{id:'comfortable',scale:.8});assert.equal(full.canonicalGradient,comfortable.canonicalGradient);assert.equal(comfortable.effectiveGradient,8);assert.ok(translateManualRoadFeel(PELOTON_MANUAL_PROFILE,comfortable,180,85).manualResistanceTarget<translateManualRoadFeel(PELOTON_MANUAL_PROFILE,full,180,85).manualResistanceTarget)})
test('Jean resistance compatibility gate ignores chatter and debounces useful changes',()=>{const gate=new ManualResistanceAnnouncementGate(4,45);assert.equal(gate.shouldAnnounce(40,0),true);assert.equal(gate.shouldAnnounce(42,50),false);assert.equal(gate.shouldAnnounce(45,20),false);assert.equal(gate.shouldAnnounce(45,50),true)})
test('FTP, strategy and duration never alter fixed-position gradient or knob target',()=>{const at=40;const snapshots:RoadSnapshot[]=[];for(const ftp of [180,208,250])for(const strategy of ['Conservative','Balanced','Aggressive'] as const)for(const mode of ['STANDARD','RECOMMENDED'] as const){const selection=durationSelectionForStage(stage,{mode});const segments=applyDurationSelection(adaptSegments(stage.segments,ftp,strategy),selection).segments;const road=createRoadModel(stage.number,segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,ftp);snapshots.push(road.roadSnapshot(road.elapsedAtCourseDistance(at)))}assert.ok(snapshots.every(snapshot=>snapshot.gradient===snapshots[0].gradient&&snapshot.elevation===snapshots[0].elevation&&snapshot.livePrescription.manualResistanceTarget===snapshots[0].livePrescription.manualResistanceTarget))})
