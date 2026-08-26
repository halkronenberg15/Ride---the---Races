import assert from 'node:assert/strict'
import test from 'node:test'
import { toRaceStage, vuelta2026 } from '../data/professionalRaces.ts'
import { adaptSegments } from './adaptiveRide.ts'
import { applyTerrainModifier, resolvePrescriptionAtState } from './prescription.ts'
import { createRoadModel } from './roadModel.ts'
import { jeanCallIsCurrent } from './jeanDirector.ts'

const stage4 = toRaceStage(vuelta2026, vuelta2026.stages[3])

test('Stage 4 uses profile ascent bounds and clears every climb immediately after its summit', () => {
  const segments = adaptSegments(stage4.segments, 208, 'Balanced')
  const road = createRoadModel(4, segments, stage4.distanceKm, undefined, stage4.profilePoints, undefined, 'La Vuelta', 'Balanced', 208)
  const distances = [6, 10, 13.9, 14, 14.1]
  const samples = distances.map(distance => road.roadSnapshot(road.elapsedAtCourseDistance(distance)))
  samples.forEach((sample,index)=>assert.ok(Math.abs(sample.courseDistance-distances[index])<1e-9))
  assert.ok(samples.slice(0, 3).every(sample => sample.gradient > 0 && sample.activeClimbId))
  assert.equal(samples[3].climbProgress, 1)
  assert.equal(samples[3].distanceToSummit, 0)
  assert.equal(samples[3].estimatedTimeToSummit, 0)
  assert.equal(samples[3].nextGradient, null)
  assert.equal(samples[4].activeClimbId, null)
  assert.equal(samples[4].gradient < 0, true)
})

test('descent after an artificial 15 km summit is never NEXT inside the climb card', () => {
  const segment = { ...stage4.segments[2], routeKm: 0, sec: 200 }
  const profile = [
    { distanceKm: 0, elevationM: 100 }, { distanceKm: 5, elevationM: 300 },
    { distanceKm: 10, elevationM: 600 }, { distanceKm: 15, elevationM: 900 },
    { distanceKm: 20, elevationM: 700 },
  ]
  const road = createRoadModel(99, [segment], 20, undefined, profile)
  const before = road.roadSnapshot(road.elapsedAtCourseDistance(14.9))
  const summit = road.roadSnapshot(road.elapsedAtCourseDistance(15))
  const after = road.roadSnapshot(road.elapsedAtCourseDistance(15.1))
  assert.ok(before.gradient > 0)
  assert.equal(before.nextGradient, null)
  assert.equal(summit.climbProgress, 1)
  assert.equal(summit.distanceToSummit, 0)
  assert.equal(after.activeClimbId, null)
  assert.ok(road.roadSnapshot(road.elapsedAtCourseDistance(15.4)).gradient < 0)
})

test('terrain pressure changes climb guidance monotonically without escaping authored power', () => {
  const segment = adaptSegments([stage4.segments[2]], 208, 'Balanced')[0]
  const base = resolvePrescriptionAtState([segment], [0], 0).currentPrescription
  const prescriptions = [2, 5, 8, 12].map(gradient => applyTerrainModifier(base, gradient, segment, 208))
  for (let index = 1; index < prescriptions.length; index += 1) {
    assert.ok(prescriptions[index].resistanceRange.min >= prescriptions[index - 1].resistanceRange.min)
    assert.ok(prescriptions[index].resistanceRange.max >= prescriptions[index - 1].resistanceRange.max)
    assert.ok(prescriptions[index].cadenceRange.min <= prescriptions[index - 1].cadenceRange.min)
    assert.ok(prescriptions[index].cadenceRange.max <= prescriptions[index - 1].cadenceRange.max)
  }
  assert.ok(prescriptions.every(item => item.powerRange && item.powerRange.min >= base.powerRange!.min && item.powerRange.max <= base.powerRange!.max))
})

test('strategy changes prescription only; geographic snapshots remain identical', () => {
  const roads = (['Conservative', 'Balanced', 'Aggressive'] as const).map(strategy => {
    const segments = adaptSegments(stage4.segments, 208, strategy)
    return createRoadModel(4, segments, stage4.distanceKm, undefined, stage4.profilePoints, undefined, 'La Vuelta', strategy, 208)
  })
  const at = roads[0].elapsedAtCourseDistance(10)
  const snapshots = roads.map(road => road.roadSnapshot(at))
  assert.ok(snapshots.every(sample => sample.courseDistance === snapshots[0].courseDistance && sample.gradient === snapshots[0].gradient))
  assert.equal(new Set(roads.map(road => road.prescriptionAt(at).currentPrescription.resistance)).size, 3)
})

test('Jean suppresses stale summit and preparation calls without touching event IDs', () => {
  const context = { activeClimbId: null, climbProgress: 1, distanceToSummit: 0, currentGradient: -4, courseDistance: 15.1, remainingOfficialTime: 100, segment: stage4.segments[3] }
  assert.equal(jeanCallIsCurrent('One more push to the summit.', context), false)
  assert.equal(jeanCallIsCurrent('Hold the pressure over the crest.', context), false)
  assert.equal(jeanCallIsCurrent('Summit. Good work.', context, 'summit'), false)
  assert.equal(jeanCallIsCurrent('Descent now. Release the pressure.', context, 'descent'), true)
})
