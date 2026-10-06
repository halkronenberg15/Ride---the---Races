import assert from 'node:assert/strict'
import test from 'node:test'
import { decideTacticalEvent, evolveRaceGapFromPerformance, initialTacticalState, tacticalOutcome, triggerTacticalEvent, type TacticalEvent } from './tacticalEngine.ts'
import { evaluateRiderPerformance } from './telemetry.ts'

const event:TacticalEvent={
 id:'break-1',
 type:'breakaway',
 trigger:{courseKm:40},
 jeanPrompt:'Break goes now.',
 choices:[
  {id:'go',label:'JOIN',modifier:{ftpDeltaPercent:8,fatigueDelta:6}},
  {id:'stay',label:'STAY',modifier:{ftpDeltaPercent:0,fatigueDelta:0}},
 ],
 acceptedModifier:{ftpDeltaPercent:8,fatigueDelta:6},
 declinedModifier:{ftpDeltaPercent:0,fatigueDelta:0},
 durationSeconds:120,
 cooldownSeconds:90,
 onceOnly:true,
}

test('strong performance closes tactical gap without changing geography',()=>{
 const triggered=triggerTacticalEvent(initialTacticalState(),event,41)
 const chosen=decideTacticalEvent(triggered,'go')
 const performance=evaluateRiderPerformance({
  telemetry:{power:225,cadence:90,timestamp:1000},
  target:{powerMin:210,powerMax:230,cadenceMin:85,cadenceMax:95},
  now:1500,
  priorFatigue:30,
 })
 const next=evolveRaceGapFromPerformance(chosen,performance,20)
 assert.ok((next.gap?.gapSeconds??Infinity)<(chosen.gap?.gapSeconds??0))
 assert.equal(next.gap?.gapTrend,'closing')
 assert.equal('courseDistance' in next,false)
 assert.equal('courseProgress' in next,false)
 assert.equal(tacticalOutcome(next,performance),'STRONG')
})

test('poor compliance opens the tactical gap deterministically',()=>{
 const chosen=decideTacticalEvent(triggerTacticalEvent(initialTacticalState(),event,41),'go')
 const performance=evaluateRiderPerformance({
  telemetry:{power:150,cadence:62,timestamp:1000},
  target:{powerMin:210,powerMax:230,cadenceMin:85,cadenceMax:95},
  now:1500,
  priorFatigue:82,
 })
 const next=evolveRaceGapFromPerformance(chosen,performance,20)
 assert.ok((next.gap?.gapSeconds??0)>(chosen.gap?.gapSeconds??Infinity))
 assert.equal(next.gap?.gapTrend,'opening')
 assert.equal(tacticalOutcome(next,performance),'UNDER_PRESSURE')
})

test('stale telemetry cannot alter tactical state',()=>{
 const chosen=decideTacticalEvent(triggerTacticalEvent(initialTacticalState(),event,41),'go')
 const performance=evaluateRiderPerformance({
  telemetry:{power:225,cadence:90,timestamp:1000},
  target:{powerMin:210,powerMax:230,cadenceMin:85,cadenceMax:95},
  now:20000,
 })
 assert.deepEqual(evolveRaceGapFromPerformance(chosen,performance,30),chosen)
})
