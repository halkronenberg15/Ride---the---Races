import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { crossedOfficialMarker, markerPosition, resolveOfficialCourseMarkers, validateOfficialCourseMarkers, type OfficialCourseMarker } from '../data/courseMarkers.ts'
import { tour2026, toRaceStage, vuelta2026 } from '../data/professionalRaces.ts'
import { adaptSegments } from './adaptiveRide.ts'
import { markerLabelOffset, createRoadModel } from './roadModel.ts'
import { resolvePrescriptionAtState } from './prescription.ts'
import { createStageTimeline } from './stageEngine.ts'

const source = { organization: 'Test organiser', reference: 'Official roadbook fixture' }
const marker = (id:string,type:OfficialCourseMarker['type'],routeKm:number,verified=true):OfficialCourseMarker => ({ id, type, routeKm, label:type.toUpperCase(), verified, source })

test('A: release package metadata is exactly Alpha 4.0.19', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
  const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'))
  assert.equal(packageJson.version, '4.0.19'); assert.equal(lock.version, '4.0.19'); assert.equal(lock.packages[''].version, '4.0.19')
})

test('B-E/Q: marker types, finite bounds, provenance and exact finish validate', () => {
  const context = { race:'La Vuelta 2026', stageNumber:4, officialDistanceKm:100 }
  assert.deepEqual(validateOfficialCourseMarkers([marker('ok','kom',70)],context),[])
  assert.match(validateOfficialCourseMarkers([marker('negative','kom',-1)],context)[0],/below 0/)
  assert.match(validateOfficialCourseMarkers([marker('long','sprint',101)],context)[0],/exceeds official distance/)
  assert.match(validateOfficialCourseMarkers([marker('nan','tt-check',Number.NaN)],context)[0],/finite/)
  assert.match(validateOfficialCourseMarkers([marker('finish','finish',99)],context)[0],/finish must equal/)
  assert.match(validateOfficialCourseMarkers([{...marker('bad','kom',1),type:'hill' as OfficialCourseMarker['type']}],context)[0],/unsupported/)
  assert.equal(resolveOfficialCourseMarkers([],context).find(item=>item.type==='finish')?.routeKm,100)
})

test('F-J/R/S: tracker coordinates are authoritative, deterministic and prescription-independent', () => {
  const input=[marker('zero','km-zero',0),marker('sprint','sprint',40),marker('kom','kom',70),marker('finish','finish',100)]
  const resolved=resolveOfficialCourseMarkers(input,{race:'Fixture',stageNumber:1,officialDistanceKm:100})
  assert.deepEqual(resolved.map(item=>markerPosition(item,100)),[0,.4,.7,1])
  assert.deepEqual(markerLabelOffset(.97,[.4,.7,.97]),{translateX:-112,translateY:0})
  for(const ftp of [180,208,250]) for(const strategy of ['Conservative','Balanced','Aggressive'] as const) {
    const stage=toRaceStage(vuelta2026,vuelta2026.stages[2]); const segments=adaptSegments(stage.segments,ftp,strategy)
    const road=createRoadModel(3,segments,100,undefined,stage.profilePoints,input)
    assert.deepEqual(road.markers.map(item=>item.position),[0,.4,.7,1])
  }
})

test('K-P/U/V: race markers are verified individually and never inferred from workouts or peaks', () => {
  const tour=toRaceStage(tour2026,tour2026.stages[5]); const tourRoad=createRoadModel(6,tour.segments,tour.distanceKm,undefined,tour.profilePoints,tour.officialCourseMarkers,'Tour de France 2026')
  assert.ok(tourRoad.markers.some(item=>item.type==='kilometre-zero')); assert.ok(tourRoad.markers.some(item=>item.type==='finish'))
  assert.equal(tourRoad.markers.some(item=>item.type==='kom'||item.type==='sprint'),false,'workout climbs and sprints cannot leak into markers')
  const stage4=toRaceStage(vuelta2026,vuelta2026.stages[3]); const andorra=createRoadModel(4,stage4.segments,stage4.distanceKm,undefined,stage4.profilePoints,stage4.officialCourseMarkers,'La Vuelta 2026')
  assert.deepEqual(andorra.markers.map(item=>item.type),['kilometre-zero','finish'],'Stage 4 has no repository-supported exact KOM or sprint kilometres')
  const stage1=toRaceStage(vuelta2026,vuelta2026.stages[0]); const monaco=createRoadModel(1,stage1.segments,stage1.distanceKm,undefined,stage1.profilePoints,stage1.officialCourseMarkers,'La Vuelta 2026')
  assert.equal(monaco.markers.find(item=>item.type==='time-check')?.position,5.6/9.4)
  const unverified=resolveOfficialCourseMarkers([marker('uncertain','kom',4,false)],{race:'La Vuelta',stageNumber:2,officialDistanceKm:10})
  assert.equal(unverified.some(item=>item.id==='uncertain'),false)
})

test('T/W-Z: marker work preserves canonical crossing, prescription and synchronized geography', () => {
  assert.equal(crossedOfficialMarker(39.9,40,marker('sprint','sprint',40)),true)
  assert.equal(crossedOfficialMarker(40,41,marker('sprint','sprint',40)),false)
  const stage=toRaceStage(vuelta2026,vuelta2026.stages[2]); const segments=adaptSegments(stage.segments,208,'Balanced')
  const timeline=createStageTimeline(segments,stage.distanceKm); const before=resolvePrescriptionAtState(segments,timeline.segmentStarts,500)
  const plain=createRoadModel(3,segments,stage.distanceKm,undefined,stage.profilePoints); const marked=createRoadModel(3,segments,stage.distanceKm,undefined,stage.profilePoints,[marker('verified','sprint',40)])
  assert.deepEqual(marked.prescriptionAt(500),before); assert.deepEqual(plain.prescriptionAt(500),before)
  for(const elapsed of [0,500,timeline.duration]) {
    const a=plain.roadSnapshot(elapsed); const b=marked.roadSnapshot(elapsed)
    assert.equal(a.courseDistance,b.courseDistance); assert.equal(a.courseProgress,b.courseProgress); assert.equal(a.profileY,b.profileY); assert.equal(a.elevation,b.elevation)
  }
})

test('42-stage professional marker/data audit', () => {
  for(const race of [tour2026,vuelta2026]) {
    assert.equal(race.stages.length,21)
    for(const professional of race.stages) {
      const stage=toRaceStage(race,professional); assert.ok(stage.distanceKm>0); assert.ok(stage.profilePoints.length>=2); assert.ok(stage.segments.length>0); assert.equal(stage.workoutReady,true)
      const resolved=resolveOfficialCourseMarkers(stage.officialCourseMarkers,{race:`${race.name} ${race.season}`,stageNumber:stage.number,officialDistanceKm:stage.distanceKm})
      assert.equal(resolved.at(-1)?.routeKm,stage.distanceKm); assert.ok(resolved.every(item=>item.routeKm>=0&&item.routeKm<=stage.distanceKm))
    }
  }
})
