import test from 'node:test'
import assert from 'node:assert/strict'
import { gradientResistance, type GradientSection } from './gradientRoad.ts'
import { jeanCue, jeanEventMessage, jeanMode, selectJeanMessage } from './jeanDirector.ts'
import { createStageTimeline } from './stageEngine.ts'
import { raceStages } from '../data/raceStages.ts'
import { elapsedFromClock, pauseClock, restoreRide, serializeRide } from './activeRideClock.ts'
import { engineRideRecord } from './postRide.ts'
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

test('gradient transition, rider interpolation, current/next and resistance share snapshot', () => {
  const stage = raceStages.find((item) => item.segments.some((segment) => /climb/i.test(segment.type)))!
  const timeline = createStageTimeline(stage.segments, stage.distanceKm)
  const index = stage.segments.findIndex((segment) => /climb/i.test(segment.type))
  const start = timeline.segmentStarts[index]
  const first = timeline.snapshot(start + stage.segments[index].sec * .05)
  const later = timeline.snapshot(start + stage.segments[index].sec * .15)
  assert.ok(first.activeGradientProgress > 0)
  assert.ok(first.climbProgress < later.climbProgress)
  assert.notEqual(first.activeGradientIndex, later.activeGradientIndex)
  assert.equal(first.currentGradient, first.gradientSections[first.activeGradientIndex].gradient)
  assert.equal(first.nextGradient, first.gradientSections[first.activeGradientIndex + 1].gradient)
  assert.equal(first.resistanceRecommendation, gradientResistance(first.segment, first.gradientSections, first.activeGradientIndex))
})

test('Jean summit timing, priority and stale-sector cancellation are deterministic', () => {
  assert.match(jeanCue('climb', 'summit-60'), /One minute/)
  const coaching = { id: '1:coach', sectorIndex: 1, priority: 6 as const, text: 'coach' }
  const urgent = jeanEventMessage('climb', 'final-10', 1)!
  assert.equal(selectJeanMessage(coaching, urgent, 1), urgent)
  assert.equal(selectJeanMessage(null, urgent, 2), null)
  assert.equal(jeanEventMessage('recovery', 'paused', 1), null)
})

test('refresh persistence restores the same active stage clock', () => {
  const ride = { stageNumber: 7, strategy: 'Balanced', accumulatedSeconds: 90, runningSince: 1_000, paused: false }
  assert.deepEqual(restoreRide(serializeRide(ride)), ride)
})

test('post-ride association preserves authoritative stage and actual engine time', () => {
  const recovery = { date: '2026-08-09', sleepHours: 8, recoveryScore: 80, fatigue: 20, mood: 'Good' as const }
  const record = engineRideRecord({ race: 'Tour de France', stageNumber: 7, stageName: 'Stage Seven', distanceKm: 170, plannedSeconds: 3600, actualSeconds: 3600.4, tactic: 'Balanced', ftp: 206, recovery }, 'ride-7', '2026-08-09')
  assert.equal(record.stageNumber, 7)
  assert.equal(record.actualEngineDurationSeconds, 3600)
  assert.equal(record.recovery, recovery)
})
