import test from 'node:test'
import assert from 'node:assert/strict'
import { raceStages } from '../data/raceStages.ts'
import { createRoadModel } from './roadModel.ts'
import { buildJeanTimeline, jeanEventsCrossed } from './stageEngine.ts'

const stage = raceStages.find((item) => item.number === 7)!
const road = createRoadModel(stage.number, stage.segments, stage.distanceKm)

test('Stage 7 has one exact road coordinate at every sector boundary', () => {
  for (let index = 0; index < stage.segments.length; index += 1) {
    const boundary = road.segmentStarts[index]
    const at = road.roadSnapshot(boundary)
    assert.equal(at.segmentIndex, index)
    if (index === stage.segments.length - 1 && stage.segments[index].routeKm >= stage.distanceKm) assert.ok(at.roadPosition < 1)
    else assert.equal(at.roadPosition, at.sectionStartCourseDistance / stage.distanceKm)
    assert.equal(at.riderPosition, at.courseProgress)
    assert.equal(at.profileY, road.elevationAt(at.roadPosition))
    if (index > 0) assert.equal(road.roadSnapshot(boundary - 0.001).segmentIndex, index - 1)
    if (boundary < road.duration) assert.equal(road.roadSnapshot(boundary + 0.001).segmentIndex, index)
  }
})

test('Stage 7 kilometre zero marker, warning and crossing share the timeline', () => {
  const marker = road.markers.find((item) => item.type === 'kilometre-zero')!
  assert.ok(marker)
  assert.equal(road.roadSnapshot(marker.at).roadPosition, marker.position)
  const events = buildJeanTimeline(stage.segments)
  assert.ok(events.some((event) => event.type === 'kilometre-zero-warning' && event.at === marker.at - 30))
  assert.ok(events.some((event) => event.type === 'kilometre-zero' && event.at === marker.at))
  assert.equal(jeanEventsCrossed(events, marker.at - 31, marker.at - 30).filter((event) => event.type === 'kilometre-zero-warning').length, 1)
  assert.equal(jeanEventsCrossed(events, marker.at, marker.at).length, 0)
})

test('climb gradient, terrain, resistance and progress change on identical breakpoints', () => {
  const climbIndex = stage.segments.findIndex((segment) => /climb|côte|cote/i.test(`${segment.name} ${segment.type}`))
  assert.ok(climbIndex >= 0)
  const start = road.segmentStarts[climbIndex]
  const climb = stage.segments[climbIndex]
  const sixty = road.roadSnapshot(start + climb.sec * 0.6)
  assert.equal(sixty.segmentIndex, climbIndex)
  assert.ok(Math.abs(sixty.climbProgress - 0.6) < 1e-9)
  assert.equal(sixty.profileY, road.elevationAt(sixty.roadPosition))
  for (const block of sixty.gradientSections.slice(0, -1)) {
    const boundary = start + climb.sec * block.end
    const before = road.roadSnapshot(boundary - 0.001)
    const at = road.roadSnapshot(boundary)
    assert.notEqual(before.gradientIndex, at.gradientIndex)
    assert.equal(at.profileY, road.elevationAt(at.roadPosition))
    assert.equal(at.resistance, road.roadSnapshot(boundary).resistance)
  }
})

test('pause-equivalent timestamps do not cross events and finish is exact', () => {
  const events = buildJeanTimeline(stage.segments)
  const summit = events.find((event) => event.type === 'summit')!
  assert.deepEqual(jeanEventsCrossed(events, summit.at - 1, summit.at - 1), [])
  assert.equal(jeanEventsCrossed(events, summit.at - 1, summit.at).filter((event) => event.key === summit.key).length, 1)
  const finish = road.roadSnapshot(road.duration + 60)
  assert.equal(finish.roadPosition, 1)
  assert.equal(finish.routeDistanceKm, stage.distanceKm)
  assert.equal(finish.stageRemaining, 0)
  assert.equal(road.markers.at(-1)?.position, 1)
})
