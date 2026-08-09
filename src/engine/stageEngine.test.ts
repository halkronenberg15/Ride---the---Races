import test from 'node:test'
import assert from 'node:assert/strict'
import { createStageTimeline } from './stageEngine.ts'
import { raceStages } from '../data/raceStages.ts'

test('target stage adaptations and synchronized finish times', () => {
  for (const minutes of [45, 60, 65, 75, 90]) {
    const stage = raceStages.find((item) => item.segments.reduce((sum, segment) => sum + segment.sec, 0) === minutes * 60)
    assert.ok(stage, `${minutes} minute stage exists`)
    const timeline = createStageTimeline(stage!.segments, stage!.distanceKm)
    assert.equal(timeline.duration, minutes * 60)
    assert.equal(timeline.snapshot(timeline.duration).stageRemaining, 0)
    assert.ok(timeline.snapshot(timeline.duration).events.includes('finish'))
  }
})

test('sector, climb boundaries, route and rider position share one snapshot', () => {
  const stage = raceStages.find((item) => item.segments.some((segment) => /climb/i.test(segment.type)))!
  const timeline = createStageTimeline(stage.segments, stage.distanceKm)
  const climbIndex = stage.segments.findIndex((segment) => /climb/i.test(segment.type))
  const entry = timeline.snapshot(timeline.segmentStarts[climbIndex])
  assert.equal(entry.segmentIndex, climbIndex)
  assert.ok(entry.events.includes('climb-entry'))
  const middle = timeline.snapshot(timeline.segmentStarts[climbIndex] + entry.segment.sec / 2)
  assert.ok(middle.routeDistanceKm >= entry.routeDistanceKm)
  assert.equal(middle.riderPosition, middle.routeDistanceKm / stage.distanceKm)
  const exit = timeline.snapshot(timeline.segmentStarts[climbIndex + 1])
  assert.ok(exit.events.includes('summit-exit'))
  assert.ok(exit.events.includes('sector-entry'))
})
