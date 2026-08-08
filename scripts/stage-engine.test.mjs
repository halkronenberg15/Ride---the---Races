import test from 'node:test'
import assert from 'node:assert/strict'
import { createStageTimeline, gradientToResistance, PRE_RIDE_COUNTDOWN_SECONDS } from '../src/engine/stageEngine.ts'
import { jeanGear, jeanMode } from '../src/services/adaptiveJean.ts'

const segment = (name, type, sec, routeKm) => ({
  name, type, sec, routeKm, zone: 'Z4', power: '200–220 W', cadence: '80 rpm',
  resistance: '50–62%', icon: 'x', description: '', objective: '', secondaryObjective: '', terrainLabel: type,
})

test('route position, climb entry, summit exit and timing remain synchronized', () => {
  for (const minutes of [45, 60, 65, 75, 90]) {
    const timeline = createStageTimeline([
      segment('Rollout', 'Neutralized start', minutes * 20, 0),
      segment('Col Test', 'Category 1 climb', minutes * 20, 40),
      segment('Descent', 'Recovery', minutes * 20, 80),
    ])
    assert.equal(timeline.duration, minutes * 60)
    const climb = timeline.snapshot(minutes * 20 + minutes * 10)
    assert.equal(climb.phase, 'climbing')
    assert.equal(climb.segmentProgress, 0.5)
    assert.equal(climb.routeKm, 60)
    assert.equal(climb.routePosition, 0.75)
    const summitExit = timeline.snapshot(minutes * 40)
    assert.equal(summitExit.phase, 'racing')
    assert.ok(summitExit.events.includes('summit'))
  }
})

test('gradient mapping creates narrow recommendations inside the envelope', () => {
  const low = gradientToResistance(5.8, { min: 50, max: 62 })
  const high = gradientToResistance(9.2, { min: 50, max: 62 })
  assert.ok(low.max - low.min <= 2)
  assert.ok(high.max - high.min <= 2)
  assert.ok(high.midpoint > low.midpoint)
})

test('countdown is five seconds and Jean selects decisive emotional gears', () => {
  assert.equal(PRE_RIDE_COUNTDOWN_SECONDS, 5)
  const climbTimeline = createStageTimeline([segment('Col Test', 'Category 1 climb', 60, 0)])
  const climbFinish = climbTimeline.snapshot(51)
  assert.equal(jeanMode(climbFinish.segment, climbFinish), 'climb')
  assert.equal(jeanGear('climb', climbFinish), 'urgent')
  const sprintTimeline = createStageTimeline([segment('Final sprint', 'Sprint finish', 60, 0)])
  const sprintFinish = sprintTimeline.snapshot(31)
  assert.equal(jeanMode(sprintFinish.segment, sprintFinish), 'sprint')
  assert.equal(jeanGear('sprint', sprintFinish), 'urgent')
})
