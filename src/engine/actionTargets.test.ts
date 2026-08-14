import assert from 'node:assert/strict'
import test from 'node:test'
import type { RideSegment } from '../data/raceStages.ts'
import { createRoadModel } from './roadModel.ts'
import { buildSprintPhases } from './sprintPhases.ts'

const segment = (overrides: Partial<RideSegment>): RideSegment => ({ name:'Road', type:'Endurance', zone:'Z2', power:'140–160 W', cadence:'85–95 rpm', resistance:'35–45%', routeKm:0, icon:'🚴', sec:100, description:'Ride', objective:'Hold', secondaryObjective:'Help', terrainLabel:'Road', ...overrides })

test('normal CURRENT and UP NEXT expose every actionable target', () => {
  const model = createRoadModel(1, [segment({}), segment({ name:'Tempo', zone:'Z3', power:'170–190 W', cadence:'90–100 rpm', resistance:'45–55%', routeKm:10 })], 20)
  const result = model.actionTargets(25)
  assert.equal(result.current.name, 'Road')
  assert.deepEqual({ zone:result.next?.zone, power:result.next?.power, cadence:result.next?.cadence, resistance:result.next?.resistance }, { zone:'Z3', power:'170–190 W', cadence:'90–100 rpm', resistance:'45–55%' })
  assert.equal(result.timeUntilNext, 75)
})

test('sprint BUILD, POSITION and LAUNCH resolve the following phase actual targets', () => {
  const sprint = segment({ name:'Intermediate Sprint', type:'Sprint', zone:'Z5', power:'240–320 W', cadence:'100–120 rpm', resistance:'50–70%', sec:100 })
  const phases = buildSprintPhases(sprint)
  const model = createRoadModel(2, [sprint, segment({ name:'Recovery', routeKm:10 })], 20)
  for (let index=0; index<3; index++) {
    const result = model.actionTargets(phases[index].start + 0.1)
    assert.equal(result.current.name, phases[index].name)
    assert.equal(result.next?.name, phases[index + 1].name)
    assert.deepEqual([result.next?.zone,result.next?.power,result.next?.cadence,result.next?.resistance], [phases[index+1].zone,phases[index+1].power,phases[index+1].cadence,phases[index+1].resistance])
  }
})

test('gradient target transition wins before the next section', () => {
  const climb = segment({ name:'Col Test', type:'Category climb', zone:'Z4', resistance:'48–68%', sec:500 })
  const model = createRoadModel(3, [climb, segment({ name:'Descent', routeKm:10 })], 20)
  const result = model.actionTargets(1)
  assert.equal(result.next?.type, 'gradient')
  assert.ok((result.next?.at ?? Infinity) < 500)
  assert.notEqual(result.next?.resistance, result.current.resistance)
})

test('same authoritative elapsed freezes pause and resumes without drift', () => {
  const model = createRoadModel(1, [segment({}), segment({ name:'Next', routeKm:10 })], 20)
  const paused = model.actionTargets(40)
  assert.deepEqual(model.actionTargets(40), paused)
  assert.equal(model.actionTargets(41).timeUntilNext, (paused.timeUntilNext ?? 0) - 1)
})

test('stage end has no phantom UP NEXT', () => {
  const model = createRoadModel(1, [segment({})], 10)
  assert.equal(model.actionTargets(model.duration).next, null)
  assert.equal(model.actionTargets(model.duration).timeUntilNext, null)
})
