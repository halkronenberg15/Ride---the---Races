import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getLibraryStage } from '../src/data/raceLibrary.ts'
import { adaptSegments } from '../src/engine/adaptiveRide.ts'
import { applyDurationSelection, durationSelectionForStage } from '../src/engine/durationEngine.ts'
import { createRoadModel } from '../src/engine/roadModel.ts'
import { canonicalCoursePosition } from '../src/engine/alpha4023.ts'
import { createPreRacePlan, preRaceSnapshot } from '../src/engine/preRaceLifecycle.ts'
import { ClimbProfile4023 } from '../src/components/ClimbProfile4023.ts'
import { ProfileDetail4022, WorldsOverviewLabels } from '../src/components/WorldsRaceLayer.ts'
import { RiderMarker4023 } from '../src/components/RiderMarker4023.ts'
import { targetPreview4023 } from '../src/engine/targetPreview4023.ts'
import { completionLabel, lifecycleJeanMessage, lifecycleProfileContext } from '../src/engine/cockpitPresentation4023.ts'
const stage=getLibraryStage('vuelta-2026',9)!
for(const minutes of [90,112]){const timed=applyDurationSelection(adaptSegments(stage.segments,206,'Balanced'),durationSelectionForStage(stage,{mode:minutes===90?'CUSTOM':'RECOMMENDED',customMinutes:minutes})).segments;const plan=createPreRacePlan(timed,minutes);assert.equal(preRaceSnapshot(plan,plan.warmupSeconds).phase,'KILOMETRE_ZERO');assert.equal(preRaceSnapshot(plan,plan.warmupSeconds).officialElapsed,0);const road=createRoadModel(9,plan.officialSegments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,206);const before=canonicalCoursePosition(road,road.raceFinishTime-.01),finish=canonicalCoursePosition(road,road.raceFinishTime);assert(before.completion<100&&before.remainingDistance>0);assert.equal(finish.completion,100);assert.equal(finish.remainingDistance,0);const climb=road.climbs.at(-1)!;const position=canonicalCoursePosition(road,road.elapsedAtCourseDistance((climb.startDistance+climb.summitDistance)/2));const html=renderToStaticMarkup(createElement(ClimbProfile4023,{model:road,position,currentResistance:'resolver',nextResistance:'resolver',formatDistance:String,formatTime:String}));assert.match(html,/Continuous colored climb mountain/);assert.match(html,/data-direction="right"/);assert.doesNotMatch(html,/gradient-block/);const preview=targetPreview4023(position.currentSector,1,position.currentTargets);assert.equal(preview.power,position.currentTargets.power);assert.equal(preview.cadence,position.currentTargets.cadence);assert.equal(preview.openingResistance,position.currentTargets.manualTarget.recommendedResistance)}
const hub=renderToStaticMarkup(createElement(WorldsOverviewLabels));assert.equal((hub.match(/12× MOUNT ROYAL/g)??[]).length,1);assert.doesNotMatch(hub,/SOUTH SHORE|BRIDGE|AVENUE DU PARC/)
const rider=renderToStaticMarkup(createElement(RiderMarker4023,{kind:'profile',left:50,top:50,coordinate:.5}));assert.match(rider,/data-direction="right"/)
const detail=renderToStaticMarkup(createElement(ProfileDetail4022,{state:{mode:'DETAIL',activeRangeId:null,autoConsumedIds:[]},progress:.2,currentGradient:-1.6,nextGradient:2.8,changeDistance:'0.3 mi',resistance:'45–48%',context:'Opening Mountain Approach'}));assert.match(detail,/Opening Mountain Approach/);assert.doesNotMatch(detail,/detail-gradient-blocks/)
assert.equal(lifecycleProfileContext(true,'PRE_RACE_WARMUP','Opening Mountain'),'PRE-RACE STAGING');assert.equal(lifecycleProfileContext(true,'KILOMETRE_ZERO','Opening Mountain'),'KILOMETRE ZERO');assert.doesNotMatch(lifecycleJeanMessage(true,'PRE_RACE_WARMUP','stale'),/Press Start/);assert.equal(completionLabel(.4,.5),'<1% COMPLETE')
console.log('Alpha 4.0.23 audit passed: one start gate/Jean message, lifecycle context, sub-one-percent progress, canonical finish, exact previews, readable controls/Detail, right-facing rider, and connected Climb View at 90/112 minutes.')
