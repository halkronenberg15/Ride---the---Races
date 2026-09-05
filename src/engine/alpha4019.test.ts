import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { toRaceStage, tour2026, vuelta2026 } from '../data/professionalRaces.ts'
import { applyDurationSelection, durationSelectionForStage } from './durationEngine.ts'
import { createRoadModel } from './roadModel.ts'
import { competitiveEventsEligible, rolloutProgress, segmentPurposes } from './raceLifecycle.ts'
import { GENERIC_MANUAL_EQUIPMENT, PELOTON_BASELINE_EQUIPMENT, PELOTON_MANUAL_PROFILE, resolveManualBikeTarget } from './manualBike.ts'

const stage6=toRaceStage(vuelta2026,vuelta2026.stages[5])
test('Stage 6 lifecycle protects KM0 and official duration at every supported selection',()=>{
 for(const minutes of [70,80,95,105,120,140]){
  const selected=durationSelectionForStage(stage6,{mode:'CUSTOM',customMinutes:minutes});const timed=applyDurationSelection(stage6.segments,selected)
  assert.equal(timed.map.officialDurationSeconds,minutes*60)
  const purposes=segmentPurposes(timed.segments),km0=purposes.indexOf('kilometre-zero');assert.equal(timed.segments[km0].sec,45)
  const road=createRoadModel(6,timed.segments,stage6.distanceKm,undefined,stage6.profilePoints,stage6.officialCourseMarkers,stage6.raceId,208)
  assert.equal(road.roadSnapshot(0).lifecycle,'NEUTRAL_ROLLOUT');assert.equal(road.roadSnapshot(0).courseDistance,0)
  assert.equal(road.roadSnapshot(road.segmentStarts[km0]+.1).lifecycle,'KILOMETRE_ZERO')
  assert.equal(road.roadSnapshot(road.segmentStarts[km0+1]+.1).lifecycle,'OFFICIAL_RACING')
  const finish=road.roadSnapshot(minutes*60);assert.equal(finish.lifecycle,'FINISHED');assert.equal(finish.courseProgress,1)
 }
})
test('rollout phases are deterministic, monotonic and remain in Z1-Z2',()=>{const values=[0,.25,.6,.9,1].map(value=>rolloutProgress(value*600,600));assert.deepEqual(values.map(v=>v.phase),['OPENING','DEVELOPMENT','DEVELOPMENT','PREPARATION','PREPARATION']);assert.ok(values.every((v,i)=>i===0||v.intensityPercent>=values[i-1].intensityPercent));assert.ok(values.every(v=>v.intensityPercent<=72));assert.equal(competitiveEventsEligible('NEUTRAL_ROLLOUT'),false);assert.equal(competitiveEventsEligible('KILOMETRE_ZERO'),false);assert.equal(competitiveEventsEligible('OFFICIAL_RACING'),true)})
test('Stage 6 field target is reconciled and unsupported bikes never get Peloton resistance',()=>{const input={powerRange:{min:177,max:210},cadenceRange:{min:86,max:100},gradient:-1.7};const peloton=resolveManualBikeTarget({...input,equipment:PELOTON_BASELINE_EQUIPMENT,profile:PELOTON_MANUAL_PROFILE});assert.notEqual(peloton.resolvedExactResistance,35);assert.ok(peloton.feasibility==='ADJUSTED'||peloton.feasibility==='EXACT');assert.ok(peloton.predictedPowerRange!.max>=177&&peloton.predictedPowerRange!.min<=210);const unsupported=resolveManualBikeTarget({...input,equipment:GENERIC_MANUAL_EQUIPMENT,profile:null});assert.equal(unsupported.feasibility,'UNAVAILABLE');assert.equal(unsupported.resolvedExactResistance,null)})
test('new users are not Hal-seeded and legacy careers have an explicit migration path',()=>{const source=readFileSync(new URL('../state/CareerContext.tsx',import.meta.url),'utf8');assert.match(source,/name: ''/);assert.match(source,/ftpKnown: false/);assert.match(source,/function legacyEquipment/);assert.match(source,/peloton-baseline-bike/);assert.match(source,/schemaVersion:3/)})
test('42 stages retain exact finish and mobile cockpit exposes safe areas and exact preview',()=>{for(const race of [tour2026,vuelta2026])for(const raw of race.stages){const stage=toRaceStage(race,raw),timed=applyDurationSelection(stage.segments,durationSelectionForStage(stage,{mode:'RECOMMENDED'}));const road=createRoadModel(stage.number,timed.segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,208);assert.equal(road.roadSnapshot(road.duration).courseProgress,1)}const ui=readFileSync(new URL('../screens/RideScreen.tsx',import.meta.url),'utf8');assert.match(ui,/safe-area-inset-top/);assert.match(ui,/OPENING RESISTANCE/);assert.match(ui,/SELECTED COURSE DURATION/)})
