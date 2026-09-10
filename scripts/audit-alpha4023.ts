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
const stage=getLibraryStage('vuelta-2026',9)!
for(const minutes of [90,112]){const timed=applyDurationSelection(adaptSegments(stage.segments,206,'Balanced'),durationSelectionForStage(stage,{mode:minutes===90?'CUSTOM':'RECOMMENDED',customMinutes:minutes})).segments;const plan=createPreRacePlan(timed,minutes);assert.equal(preRaceSnapshot(plan,plan.warmupSeconds).phase,'KILOMETRE_ZERO');assert.equal(preRaceSnapshot(plan,plan.warmupSeconds).officialElapsed,0);const road=createRoadModel(9,plan.officialSegments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,206);const before=canonicalCoursePosition(road,road.raceFinishTime-.01),finish=canonicalCoursePosition(road,road.raceFinishTime);assert(before.completion<100&&before.remainingDistance>0);assert.equal(finish.completion,100);assert.equal(finish.remainingDistance,0);const climb=road.climbs.at(-1)!;const position=canonicalCoursePosition(road,road.elapsedAtCourseDistance((climb.startDistance+climb.summitDistance)/2));const html=renderToStaticMarkup(createElement(ClimbProfile4023,{model:road,position,currentResistance:'resolver',nextResistance:'resolver',formatDistance:String,formatTime:String}));assert.match(html,/Continuous colored climb mountain/);assert.doesNotMatch(html,/gradient-block/)}
console.log('Alpha 4.0.23 audit passed: one start gate, canonical finish, connected Climb View, and Stage 9 at 90/112 minutes.')
