import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateRiderPerformance, type DeviceAdapter } from './telemetry.ts'

test('telemetry performance evaluates targets without owning geography',()=>{
 const result=evaluateRiderPerformance({
  telemetry:{power:220,cadence:88,heartRate:142,speed:31,timestamp:1000},
  target:{powerMin:210,powerMax:230,cadenceMin:85,cadenceMax:95},
  now:1500,
  priorFatigue:20,
 })
 assert.equal(result.targetCompliance,1)
 assert.equal(result.powerCompliance,1)
 assert.equal(result.cadenceCompliance,1)
 assert.equal(result.stale,false)
 assert.ok(result.fatigue<20)
 assert.equal('courseDistance' in result,false)
 assert.equal('courseProgress' in result,false)
})

test('missing signals remain missing instead of fabricated',()=>{
 const result=evaluateRiderPerformance({
  telemetry:{heartRate:150,timestamp:1000},
  target:{powerMin:200,powerMax:230,cadenceMin:80,cadenceMax:95},
  now:1500,
 })
 assert.equal(result.powerCompliance,null)
 assert.equal(result.cadenceCompliance,null)
 assert.equal(result.targetCompliance,null)
})

test('stale telemetry does not change fatigue',()=>{
 const result=evaluateRiderPerformance({
  telemetry:{power:100,cadence:50,timestamp:1000},
  target:{powerMin:200,powerMax:230,cadenceMin:80,cadenceMax:95},
  now:12000,
  priorFatigue:44,
 })
 assert.equal(result.stale,true)
 assert.equal(result.fatigue,44)
})

test('device adapters normalize provider samples at the boundary',()=>{
 type Sample={watts:number;rpm:number;at:number}
 const adapter:DeviceAdapter<Sample>={normalize:sample=>({power:sample.watts,cadence:sample.rpm,timestamp:sample.at})}
 assert.deepEqual(adapter.normalize({watts:205,rpm:91,at:42}),{power:205,cadence:91,timestamp:42})
})
