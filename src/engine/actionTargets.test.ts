import assert from 'node:assert/strict'
import test from 'node:test'
import type { RideSegment } from '../data/raceStages.ts'
import { createRoadModel } from './roadModel.ts'

const segment = (overrides: Partial<RideSegment>): RideSegment => ({ name:'Road', type:'Endurance', zone:'Z2', power:'140–160 W', cadence:'85–95 rpm', resistance:'35–45%', routeKm:0, icon:'🚴', sec:100, description:'Ride', objective:'Hold', secondaryObjective:'Help', terrainLabel:'Road', ...overrides })

test('normal CURRENT and UP NEXT expose every actionable target', () => {
  const model = createRoadModel(1, [segment({}), segment({ name:'Tempo', zone:'Z3', power:'170–190 W', cadence:'90–100 rpm', resistance:'45–55%', routeKm:10 })], 20)
  const result = model.actionTargets(25)
  assert.equal(result.current.name, 'Road')
  assert.deepEqual({ zone:result.next?.zone, power:result.next?.power, cadence:result.next?.cadence, resistance:result.next?.resistance }, { zone:'Z3', power:'170–190 W', cadence:'90–100 rpm', resistance:'45–55%' })
  assert.equal(result.timeUntilNext, 75)
})

test('sprint and gradient geography do not create parallel workout prescriptions', () => {
  const sprint = segment({ name:'Intermediate Sprint', type:'Sprint', zone:'Z5', power:'240–320 W', cadence:'100–120 rpm', resistance:'50–70%', sec:100 })
  const model = createRoadModel(2, [sprint, segment({ name:'Recovery', routeKm:10 })], 20)
  const early = model.actionTargets(1)
  const late = model.actionTargets(90)
  assert.deepEqual(early.current, { ...late.current, remaining: early.current.remaining })
  assert.equal(early.next?.name, 'Recovery')

  const climb = segment({ name:'Col Test', type:'Category climb', zone:'Z4', resistance:'48–68%', sec:500 })
  const climbModel = createRoadModel(3, [climb, segment({ name:'Descent', routeKm:10 })], 20)
  assert.equal(climbModel.actionTargets(1).next?.type, 'section')
  assert.equal(climbModel.actionTargets(1).current.resistance, climbModel.actionTargets(400).current.resistance)
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
