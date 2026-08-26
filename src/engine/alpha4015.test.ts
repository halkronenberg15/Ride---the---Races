import assert from 'node:assert/strict'
import test from 'node:test'
import { vuelta2026, tour2026, toRaceStage } from '../data/professionalRaces.ts'
import { adaptSegments } from './adaptiveRide.ts'
import { JeanEventBus, createJeanEvent } from './jeanEvents.ts'
import { createRoadModel } from './roadModel.ts'
import { resolvePrescriptionAtState } from './prescription.ts'
import { createStageTimeline } from './stageEngine.ts'
import { officialSegments, ttStartSnapshot } from './startArchitecture.ts'

const stage3 = toRaceStage(vuelta2026, vuelta2026.stages[2])
const segments = adaptSegments(stage3.segments, 208, 'Balanced')
const timeline = createStageTimeline(segments, stage3.distanceKm)
const road = createRoadModel(3, segments, stage3.distanceKm, undefined, stage3.profilePoints)

test('A/B: prior Up Next becomes Current atomically without stale resistance', () => {
  const boundary = timeline.segmentStarts[6]
  const before = resolvePrescriptionAtState(segments, timeline.segmentStarts, boundary - .001)
  const at = resolvePrescriptionAtState(segments, timeline.segmentStarts, boundary)
  assert.deepEqual(at.currentPrescription, before.nextPrescription)
  assert.notEqual(before.currentPrescription.resistance, at.currentPrescription.resistance)
  assert.equal(road.actionTargets(boundary).current.resistance, at.currentPrescription.resistance)
})

test('C/D/R: FTP and strategy change prescription, never authoritative geography', () => {
  const balanced = adaptSegments(stage3.segments, 208, 'Balanced')
  const aggressive = adaptSegments(stage3.segments, 208, 'Aggressive')
  const b = createRoadModel(3, balanced, stage3.distanceKm, undefined, stage3.profilePoints).roadSnapshot(1500)
  const a = createRoadModel(3, aggressive, stage3.distanceKm, undefined, stage3.profilePoints).roadSnapshot(1500)
  assert.equal(b.courseDistance, a.courseDistance); assert.equal(b.gradient, a.gradient); assert.equal(b.profileY, a.profileY)
  assert.notEqual(balanced[4].power, aggressive[4].power)
  assert.match(balanced[1].power, /^141–171 W$/)
})

test('E/F: canonical Jean event fans one ID to display and speech; unavailable is honest', () => {
  const bus = new JeanEventBus(); const displayed: string[] = []; const spoken: string[] = []
  const event = createJeanEvent('vuelta2026-stage3-final-km', 'finish-approach', 'Finish the plan.')
  bus.dispatch(event, item => displayed.push(item.id), item => { spoken.push(item.id); return true })
  bus.dispatch(event, item => displayed.push(item.id), item => { spoken.push(item.id); return true })
  assert.deepEqual(displayed, [event.id]); assert.deepEqual(spoken, [event.id])
  const unavailable = bus.dispatch(createJeanEvent('no-audio', 'cue', 'Hold.'), () => undefined, () => false)
  assert.equal(unavailable.speechUnavailable, true); assert.equal(unavailable.speechSucceeded, false); assert.equal(unavailable.displayed, true)
})

test('G-M: Stage 3 course, elevation, gradient, climb and finish share one state', () => {
  let prior = 0
  for (let elapsed = 0; elapsed <= timeline.duration; elapsed += 7) {
    const state = road.roadSnapshot(elapsed); assert.ok(state.courseDistance >= prior); prior = state.courseDistance
    assert.equal(state.roadPosition, state.courseProgress)
    assert.equal(state.elevation, road.elevationAt(state.courseProgress))
    if (state.gradientSections.length) assert.equal(state.gradient, state.gradientSections[state.gradientIndex].gradient)
    assert.equal(state.stageComplete, state.courseComplete && state.officialWorkoutComplete)
    assert.equal(state.courseProgress === 1, state.stageComplete)
    if (state.courseComplete) assert.equal(state.stageRemaining, 0)
  }
  const summit = road.roadSnapshot(timeline.duration)
  assert.equal(summit.courseDistance, stage3.distanceKm); assert.equal(summit.courseProgress, 1)
  assert.equal(summit.stageComplete, true)
})

test('P/Q: next duration is planned while starts-in counts down', () => {
  const first = road.prescriptionAt(10); const later = road.prescriptionAt(20)
  assert.equal(first.nextPrescriptionDuration, later.nextPrescriptionDuration)
  assert.equal(first.timeUntilNextPrescription! - later.timeUntilNextPrescription!, 10)
})

test('S-U: road rollout and TT GO architecture remain deterministic', () => {
  assert.match(stage3.segments[0].type, /neutral/i)
  const tt = adaptSegments(toRaceStage(vuelta2026, vuelta2026.stages[0]).segments, 208, 'Balanced')
  const pre = ttStartSnapshot(tt, 0).preStageDuration
  assert.equal(ttStartSnapshot(tt, pre - 3).state, 'countdown-3')
  assert.equal(ttStartSnapshot(tt, pre).officialElapsed, 0)
  assert.equal(createStageTimeline(officialSegments(tt), 9.4).snapshot(0).courseDistance, 0)
})

test('V-Y: all 42 verified Grand Tour stages remain valid and rideable', () => {
  const races = [tour2026, vuelta2026]
  assert.deepEqual(races.map(race => race.stages.length), [21, 21])
  for (const race of races) for (const source of race.stages) {
    const stage = toRaceStage(race, source); assert.ok(stage.distanceKm > 0); assert.ok(stage.profilePoints.length >= 2); assert.ok(stage.segments.length > 0)
    const model = createRoadModel(stage.number, stage.segments, stage.distanceKm, undefined, stage.profilePoints)
    assert.equal(model.roadSnapshot(model.duration).courseDistance, stage.distanceKm)
  }
  assert.equal(toRaceStage(vuelta2026, vuelta2026.stages[0]).verification?.markers, true)
  for (const source of vuelta2026.stages.slice(1)) assert.equal(toRaceStage(vuelta2026, source).verification?.markers ?? false, false)
})
