import test from 'node:test'
import assert from 'node:assert/strict'
import { gradientResistance, type GradientSection } from './gradientRoad.ts'
import { jeanCue, jeanMode } from './jeanDirector.ts'
import { elapsedFromClock, pauseClock } from './activeRideClock.ts'
import { CLICK_IN_CUE, PRE_RIDE_COUNTDOWN } from './preRide.ts'

const sections: GradientSection[] = [5.8, 7.2, 8.8, 6.9, 9.2].map((gradient, index) => ({ gradient, start: index / 5, end: (index + 1) / 5 }))
test('gradient mapping follows pitch with narrow targets inside envelope', () => {
  const targets = sections.map((_, index) => gradientResistance({ resistance: '50–62%' }, sections, index))
  assert.deepEqual(targets, ['50–52%', '54–56%', '60–62%', '53–55%', '60–62%'])
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
})
