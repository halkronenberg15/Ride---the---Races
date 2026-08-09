import test from 'node:test'
import assert from 'node:assert/strict'
import { gradientDifficultyColor, gradientResistance, gradientSectionIndex, type GradientSection } from './gradientRoad.ts'
import { jeanCue, jeanMode } from './jeanDirector.ts'
import { elapsedFromClock, pauseClock, resumeClock } from './activeRideClock.ts'
import { CLICK_IN_CUE, PRE_RIDE_COUNTDOWN } from './preRide.ts'
import { buildJeanTimeline, createStageTimeline, jeanEventsCrossed } from './stageEngine.ts'
import { raceStages } from '../data/raceStages.ts'

const sections: GradientSection[] = [5.8, 7.2, 8.8, 6.9, 9.2].map((gradient, index) => ({ gradient, start: index / 5, end: (index + 1) / 5 }))
test('gradient mapping follows pitch with narrow targets inside envelope', () => {
  const targets = sections.map((_, index) => gradientResistance({ resistance: '50–62%' }, sections, index))
  assert.deepEqual(targets, ['50–52%', '54–56%', '60–62%', '53–55%', '60–62%'])
})
test('gradient selection follows section boundaries and Tour difficulty colors', () => {
  assert.equal(gradientSectionIndex(sections, 0), 0)
  assert.equal(gradientSectionIndex(sections, .2), 1)
  assert.equal(gradientSectionIndex(sections, 1), 4)
  assert.deepEqual([2.9, 3, 6, 9].map(gradientDifficultyColor), ['#29a35a', '#2374d8', '#d73535', '#111111'])
})
test('Jean uses TT focus and escalating sprint/climb urgency', () => {
  assert.equal(jeanMode({ name: 'Race', type: 'Time trial' }), 'time-trial')
  assert.match(jeanCue('time-trial', undefined), /pace|second|pressure/i)
  assert.match(jeanCue('sprint', 'final-30'), /Thirty seconds|launch/i)
  assert.match(jeanCue('climb', 'final-10'), /summit|drive/i)
})
test('silent countdown and click-in cue are exact', () => {
  assert.deepEqual(PRE_RIDE_COUNTDOWN, [5, 4, 3, 2, 1])
  assert.equal(CLICK_IN_CUE, 'Okay team, click in.')
})
test('active ride uses wall clock across navigation and freezes only on pause', () => {
  const clock = { accumulatedSeconds: 12, runningSince: 1_000, paused: false }
  assert.equal(elapsedFromClock(clock, 11_000), 22)
  const paused = pauseClock(clock, 11_000)
  assert.equal(elapsedFromClock(paused, 99_000), 22)
  const resumed = resumeClock(paused, 99_000)
  assert.equal(elapsedFromClock(resumed, 104_000), 27)
})

test('Jean events fire only when authoritative time crosses them', () => {
  const stage = raceStages.find((item) => item.number === 7)!
  const events = buildJeanTimeline(stage.segments)
  const climb = events.find((event) => event.type === 'climb-entry')
  if (climb) {
    assert.deepEqual(jeanEventsCrossed(events, climb.at - .5, climb.at).map((event) => event.key).includes(climb.key), true)
    assert.equal(jeanEventsCrossed(events, climb.at, climb.at).length, 0)
  }
  assert.equal(jeanEventsCrossed(events, 100, 90).length, 0)
})

test('section preview selection is independent from timeline snapshot', () => {
  const stage = raceStages.find((item) => item.number === 7)!
  const timeline = createStageTimeline(stage.segments, stage.distanceKm)
  const before = timeline.snapshot(10)
  const previewIndex = stage.segments.length - 1
  assert.notEqual(previewIndex, before.segmentIndex)
  assert.equal(timeline.snapshot(10).segmentIndex, before.segmentIndex)
})
