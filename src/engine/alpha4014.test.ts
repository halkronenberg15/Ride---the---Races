import assert from 'node:assert/strict'
import test from 'node:test'
import { vuelta2026, toRaceStage } from '../data/professionalRaces.ts'
import { adaptSegment, adaptSegments } from './adaptiveRide.ts'
import { createPrescription, zoneForFtpRange } from './prescription.ts'
import { createRoadModel } from './roadModel.ts'
import { createStageTimeline } from './stageEngine.ts'
import { officialSegments, ttStartSnapshot } from './startArchitecture.ts'

const ftpSegment = vuelta2026.stages[1].segments[1]

test('A/B: one FTP prescription produces coherent zone, watts and plausible guidance', () => {
  const result = adaptSegment(ftpSegment, 208, 'Balanced')
  assert.equal(result.power, '141–171 W')
  assert.equal(result.zone, zoneForFtpRange(68, 82))
  assert.match(result.cadence, /^\d+[–-]\d+ rpm$/)
  assert.match(result.resistance, /^\d+[–-]\d+%$/)
  assert.equal(adaptSegment(ftpSegment, 250, 'Balanced').power, '170–205 W')
  assert.notEqual(result.power, adaptSegment(ftpSegment, 250, 'Balanced').power)
})

test('A: direct prescription derives every target from the same FTP intensity', () => {
  const result = createPrescription(ftpSegment, 208, { min: 68, max: 82 })
  assert.equal(result.power, '141–171 W')
  assert.equal(result.zone, 'Z2–Z3')
  assert.ok(result.ftpPercent.min * 2.08 >= 141 - 1)
})

test('C-F: TT warm-up, gate and deterministic countdown are excluded from official time', () => {
  const segments = adaptSegments(toRaceStage(vuelta2026, vuelta2026.stages[0]).segments, 208, 'Balanced')
  const pre = ttStartSnapshot(segments, 0).preStageDuration
  assert.ok(pre > 30)
  assert.deepEqual(ttStartSnapshot(segments, 0), { state: 'warm-up', remaining: pre, officialElapsed: 0, preStageDuration: pre, official: false })
  assert.equal(ttStartSnapshot(segments, pre - 30).state, 'start-gate')
  assert.equal(ttStartSnapshot(segments, pre - 3).state, 'countdown-3')
  assert.equal(ttStartSnapshot(segments, pre - 2).state, 'countdown-2')
  assert.equal(ttStartSnapshot(segments, pre - 1).state, 'countdown-1')
  assert.equal(ttStartSnapshot(segments, pre).state, 'go')
  assert.equal(ttStartSnapshot(segments, pre).officialElapsed, 0)
  assert.equal(ttStartSnapshot(segments, pre + 1).officialElapsed, 1)
  const official = createStageTimeline(officialSegments(segments), 9.4).snapshot(0)
  assert.equal(official.elapsed, 0); assert.equal(official.courseDistance, 0); assert.equal(official.stageProgress, 0)
})

test('G: mass-start neutral rollout remains on the pre-KM0 road-stage timeline', () => {
  const stage = toRaceStage(vuelta2026, vuelta2026.stages[1])
  assert.match(stage.segments[0].type, /neutral/i)
  assert.equal(ttStartSnapshot(stage.segments, 60).preStageDuration, 0)
  const timeline = createStageTimeline(stage.segments, stage.distanceKm)
  assert.equal(timeline.snapshot(60).courseDistance, 0)
  assert.equal(timeline.snapshot(60).segment.name, 'Monaco Rollout')
})

test('H/I: Up Next has a changing starts-in and immutable full duration', () => {
  const stage = toRaceStage(vuelta2026, vuelta2026.stages[1])
  const road = createRoadModel(2, adaptSegments(stage.segments, 208, 'Balanced'), stage.distanceKm, undefined, stage.profilePoints)
  const first = road.actionTargets(10)
  const later = road.actionTargets(20)
  assert.ok(first.next && later.next)
  assert.equal(first.next.name, later.next.name)
  assert.equal(first.next.remaining, later.next.remaining)
  assert.equal(first.timeUntilNext! - later.timeUntilNext!, 10)
})

test('J-L: distance-aware gradients preserve elevation direction and canonical position', () => {
  const segment = { ...ftpSegment, routeKm: 0, sec: 100 }
  const ascent = createRoadModel(99, [segment], 10, undefined, [{ distanceKm: 0, elevationM: 0 }, { distanceKm: 5, elevationM: 100 }, { distanceKm: 10, elevationM: 0 }])
  assert.ok(ascent.roadSnapshot(25).gradient > 0)
  assert.ok(ascent.roadSnapshot(75).gradient < 0)
  assert.ok((ascent.roadSnapshot(25).nextGradient ?? 0) > 0)
  assert.equal(ascent.roadSnapshot(25).courseDistance, 2.5)
})

test('M/N: KOM geography is not invented from workout sectors and effort calls have transitioned targets', () => {
  const stage = toRaceStage(vuelta2026, vuelta2026.stages[1])
  const segments = adaptSegments(stage.segments, 208, 'Balanced')
  const road = createRoadModel(2, segments, stage.distanceKm, undefined, stage.profilePoints)
  assert.equal(road.markers.filter(marker => marker.type === 'kom').length, 0)
  const pressure = segments.findIndex(segment => segment.name === 'First Ridge Pressure')
  assert.ok(pressure > 0)
  assert.notEqual(segments[pressure - 1].power, segments[pressure].power)
  assert.notEqual(segments[pressure - 1].resistance, segments[pressure].resistance)
})
