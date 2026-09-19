import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { trainingRides } from '../data/raceLibrary.ts'
import { PELOTON_BASELINE_EQUIPMENT, GENERIC_MANUAL_EQUIPMENT, SMART_EQUIPMENT_FOUNDATION } from './manualBike.ts'
import { completeSessionTime, noFtpPresentation } from './release4024.ts'
import { createStageTimeline } from './stageEngine.ts'
import { elapsedFromClock, pauseClock, resumeClock } from './activeRideClock.ts'

const calibration=trainingRides.find(ride=>ride.id==='intro-calibration')!
const project=(index:number)=>noFtpPresentation(calibration.stage.segments[index],PELOTON_BASELINE_EQUIPMENT,undefined,index)

test('calibration work steps are physically purposeful and checkpoints hold the evaluated step',()=>{
 const targets=calibration.stage.segments.map((_,index)=>project(index))
 assert.deepEqual(targets.map(({effort,cadence,resistance})=>({effort,cadence,resistance})),[
  {effort:'VERY EASY',cadence:'55–65 rpm',resistance:'25–30%'},
  {effort:'EASY',cadence:'55–65 rpm',resistance:'28–33%'},
  {effort:'CHECK IN',cadence:'55–65 rpm',resistance:'28–33%'},
  {effort:'COMFORTABLE',cadence:'65–75 rpm',resistance:'27–32%'},
  {effort:'CHECK IN',cadence:'65–75 rpm',resistance:'27–32%'},
  {effort:'EASY',cadence:'60–70 rpm',resistance:'25–30%'},
  {effort:'VERY EASY',cadence:'55–65 rpm',resistance:'20–25%'},
 ])
 assert.deepEqual([targets[2].cadence,targets[2].resistance],[targets[1].cadence,targets[1].resistance])
 assert.deepEqual([targets[4].cadence,targets[4].resistance],[targets[3].cadence,targets[3].resistance])
 for(const [a,b] of [[0,1],[2,3],[4,5],[5,6]])assert.notDeepEqual([targets[a].cadence,targets[a].resistance],[targets[b].cadence,targets[b].resistance])
})

test('Cadence Change changes cadence while Up Next, activation and restoration share one snapshot',()=>{
 const control=trainingRides.find(ride=>ride.id==='intro-control-30')!
 const easy=noFtpPresentation(control.stage.segments[0],PELOTON_BASELINE_EQUIPMENT,undefined,0)
 const preview=noFtpPresentation(control.stage.segments[1],PELOTON_BASELINE_EQUIPMENT,undefined,1)
 const active=noFtpPresentation(control.stage.segments[1],PELOTON_BASELINE_EQUIPMENT,undefined,1)
 assert.notEqual(preview.cadence,easy.cadence)
 assert.deepEqual(preview,active)
 assert.deepEqual(structuredClone(active),active)
})

test('calibration intent remains safe and equipment-aware',()=>{
 for(const equipment of [PELOTON_BASELINE_EQUIPMENT,GENERIC_MANUAL_EQUIPMENT,SMART_EQUIPMENT_FOUNDATION])for(let index=0;index<calibration.stage.segments.length;index++){
  const target=noFtpPresentation(calibration.stage.segments[index],equipment,undefined,index)
  assert.doesNotMatch(`${target.resistance}`,/^0–|0–2%|0–3%/)
 }
 assert.equal(project(1).resistance,'28–33%')
 assert.equal(noFtpPresentation(calibration.stage.segments[1],GENERIC_MANUAL_EQUIPMENT).resistance,'Light–Moderate load')
})

test('whole-second session projection always balances and has one final active second',()=>{
 for(const elapsed of [0,.001,.999,1,299.999,300,300.001,599.999,600,600.001,779.999,780,1619.999,1620,1798.999,1799,1799.999,1800,1800.25]){
  const time=completeSessionTime(1800,elapsed)
  assert.equal(time.elapsed+time.remaining,time.total)
  assert.ok(time.remaining>=0)
 }
 assert.deepEqual(completeSessionTime(1800,1799.999),{total:1800,elapsed:1799,remaining:1,complete:false})
 assert.deepEqual(completeSessionTime(1800,1800),{total:1800,elapsed:1800,remaining:0,complete:true})
})

test('boundaries, pause/resume and restored clocks retain the same session projection',()=>{
 const timeline=createStageTimeline(calibration.stage.segments,calibration.stage.distanceKm)
 for(const boundary of timeline.segmentStarts.slice(1)){
  assert.notEqual(timeline.snapshot(boundary-.001).segmentIndex,timeline.snapshot(boundary).segmentIndex)
  assert.equal(timeline.snapshot(boundary).segmentIndex,timeline.snapshot(boundary+.001).segmentIndex)
 }
 const running={accumulatedSeconds:299.4,runningSince:1000,paused:false}
 const paused=pauseClock(running,1600)
 assert.equal(elapsedFromClock(paused,9000),300)
 const resumed=resumeClock(paused,9000)
 assert.equal(elapsedFromClock(resumed,9500),300.5)
 assert.deepEqual(completeSessionTime(1800,elapsedFromClock(structuredClone(resumed),9500)),completeSessionTime(1800,300.5))
 assert.equal(timeline.snapshot(1799.999).stageComplete,false)
 assert.equal(timeline.snapshot(1800).stageComplete,true)
})

test('countdown group is centered without changing the tracker header or Safari spacing',()=>{
 const ride=readFileSync(new URL('../screens/RideScreen.tsx',import.meta.url),'utf8')
 assert.match(ride,/\.compact-section-clock\{[^}]*justify-content:center[^}]*text-align:center[^}]*gap:8px[^}]*width:100%[^}]*white-space:nowrap/)
 assert.match(ride,/\.live-tracker-4023\{display:grid/)
 const css=readFileSync(new URL('../App.css',import.meta.url),'utf8')
 assert.doesNotMatch(css,/4\.0\.24\.1[^]*safe-area-inset-bottom/)
})
