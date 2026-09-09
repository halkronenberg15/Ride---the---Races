import assert from 'node:assert/strict'
import { getLibraryStage } from '../src/data/raceLibrary.ts'
import { adaptSegments } from '../src/engine/adaptiveRide.ts'
import { applyDurationSelection, durationSelectionForStage } from '../src/engine/durationEngine.ts'
import { createRoadModel } from '../src/engine/roadModel.ts'
import { canonicalCoursePosition } from '../src/engine/alpha4023.ts'
const stage=getLibraryStage('vuelta-2026',9)!
for(const minutes of [90,112]){const segments=applyDurationSelection(adaptSegments(stage.segments,206,'Balanced'),durationSelectionForStage(stage,{mode:minutes===90?'CUSTOM':'RECOMMENDED',customMinutes:minutes})).segments;const road=createRoadModel(9,segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,206);const before=canonicalCoursePosition(road,road.raceFinishTime-.01),finish=canonicalCoursePosition(road,road.raceFinishTime);assert(before.completion<100&&before.remainingDistance>0);assert.equal(finish.completion,100);assert.equal(finish.remainingDistance,0);assert(segments.find(item=>item.name==='Aitana Summit Drive')?.power!=='0–0 W')}
const source=await import('node:fs').then(fs=>fs.readFileSync(new URL('../src/screens/RideScreen.tsx',import.meta.url),'utf8'))
assert.match(source,/canonicalCoursePosition\(timeline,elapsedSeconds\)/)
assert.match(source,/LIVE WORKOUT TRACKER|training=/)
assert.doesNotMatch(source,/CalibrationHelper resistance=/)
console.log('Alpha 4.0.23 audit passed: canonical Stage 9 timing, finish, resolver, training tracker, and cockpit wiring.')
