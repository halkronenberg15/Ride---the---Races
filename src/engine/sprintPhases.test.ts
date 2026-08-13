import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSprintPhases, sprintSnapshot } from './sprintPhases.ts'

const segment = (sec: number, finish = false) => ({ name: finish ? 'Finish Sprint' : 'Intermediate Sprint', type: finish ? 'Sprint finish' : 'Sprint', zone: 'Z5–Z6', power: '218–247 W', cadence: '100–120 rpm', resistance: '45–60%', routeKm: 1, sec, target: '', description: '', objective: '', secondaryObjective: '', icon: '⚡', terrainLabel: '' })
test('two-minute intermediate sprint uses proportional road-clock boundaries', () => {
  const phases = buildSprintPhases(segment(120))
  assert.deepEqual(phases.map((p) => Math.round(p.end)), [40, 74, 100, 120])
  assert.equal(sprintSnapshot(phases, 99)?.name, 'LAUNCH')
  assert.equal(sprintSnapshot(phases, 100)?.name, 'SPRINT')
  assert.ok(Number(phases[0].power.match(/\d+/)?.[0]) < Number(phases[3].power.match(/\d+/)?.[0]))
})
test('75-second finish sprint has aggressive proportional phases', () => {
  const phases = buildSprintPhases(segment(75, true))
  assert.deepEqual(phases.map((p) => Math.round(p.end)), [25, 45, 56, 75])
  assert.equal(sprintSnapshot(phases, 74)?.zone, 'Z6')
})
