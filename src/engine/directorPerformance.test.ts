import assert from 'node:assert/strict'
import test from 'node:test'
import { directorPerformanceEvent } from './directorPerformance.ts'

test('director praises strong compliant riding without owning geography',()=>{
 const event=directorPerformanceEvent({
  eventScope:'stage-3-section-4',
  performance:{targetCompliance:.98,powerCompliance:1,cadenceCompliance:.96,fatigue:35,telemetryTimestamp:1000,stale:false},
  currentTargetLabel:'220–235 W',
  nextTargetLabel:'climb',
 })
 assert.ok(event)
 assert.match(event!.message,/right on the target/i)
 assert.equal('courseDistance' in event!,false)
})

test('director corrects poor compliance deterministically',()=>{
 const event=directorPerformanceEvent({
  eventScope:'stage-3-section-4',
  performance:{targetCompliance:.42,powerCompliance:.4,cadenceCompliance:.44,fatigue:60,telemetryTimestamp:1000,stale:false},
  currentTargetLabel:'200–215 W',
 })
 assert.ok(event)
 assert.match(event!.message,/prescribed target/i)
 assert.equal(event!.priority,70)
})

test('stale performance cannot produce coaching',()=>{
 const event=directorPerformanceEvent({
  eventScope:'stage-3-section-4',
  performance:{targetCompliance:.3,powerCompliance:.3,cadenceCompliance:.3,fatigue:99,telemetryTimestamp:1000,stale:true},
  currentTargetLabel:'200–215 W',
 })
 assert.equal(event,null)
})
