import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { cockpitControlRect, protectedTopBoundary } from './mobileLayout.ts'
import { WorkoutAllocation } from '../components/WorkoutAllocation.ts'
import { CalendarTeamBusButton } from '../components/CalendarTeamBusButton.ts'
import { PreviewTargetValues } from '../components/PreviewTargetValues.ts'
import { resolvePreviewTarget } from './previewTargets.ts'
import { getRaceStage } from '../data/raceStages.ts'
import { PELOTON_BASELINE_EQUIPMENT } from './manualBike.ts'
import { estimateBikePower, PELOTON_MANUAL_PROFILE } from './manualBike.ts'
import { buildSprintPhases } from './sprintPhases.ts'

test('rendered Leave cockpit rectangle clears protected iPhone portrait and landscape boundaries',()=>{
 for(const viewport of [{width:390,height:844,safeAreaTop:47,visualViewportTop:0},{width:844,height:390,safeAreaTop:0,visualViewportTop:21}]){const rect=cockpitControlRect(viewport);assert.ok(rect.top>=protectedTopBoundary(viewport));assert.equal(rect.height,44);assert.ok(rect.bottom>protectedTopBoundary(viewport)+44)}
})

test('rendered workout allocation has three compact label/value rows',()=>{
 const html=renderToStaticMarkup(createElement(WorkoutAllocation,{totalSeconds:4080,raceSeconds:3780,cooldownSeconds:300}))
 assert.equal((html.match(/<span>/g)??[]).length,3);assert.match(html,/Total workout<\/small><strong>68 min/);assert.match(html,/Rollout \+ KM0 \+ Race<\/small><strong>63 min/);assert.match(html,/Cooldown<\/small><strong>5 min/)
})

test('rendered calendar places an operable Team Bus button between consecutive month cards',()=>{
 let returned=0;const button=()=>createElement(CalendarTeamBusButton,{onBack:()=>{returned+=1}});const first=button(),calendar=createElement('div',{className:'season-months'},createElement('section',null,createElement('article',{className:'month-calendar'},'July'),first),createElement('section',null,createElement('article',{className:'month-calendar'},'August'),button()))
 first.props.onBack();assert.equal(returned,1);const html=renderToStaticMarkup(calendar),july=html.indexOf('July'),back=html.indexOf('Back to Team Bus'),august=html.indexOf('August');assert.ok(july<back&&back<august)
})

test('rendered Stage Briefing targets are finite and use narrow Peloton windows',()=>{
 const stage=getRaceStage(7),target=resolvePreviewTarget(stage.segments.at(-2)!,208,PELOTON_BASELINE_EQUIPMENT);const html=renderToStaticMarkup(createElement(PreviewTargetValues,{target}))
 assert.doesNotMatch(html,/maximal/i);const windows=[...html.matchAll(/(\d+)–(\d+)% · Start/g)];assert.ok(windows.length>0);assert.ok(windows.every(match=>Number(match[2])-Number(match[1])<=3));assert.match(html,/POWER<\/small><strong>\d+–\d+ W/)
})

test('every rendered Sprint phase has a finite feasible power/cadence/resistance intersection',()=>{
 const stage=getRaceStage(7),sprints=stage.segments.filter(segment=>buildSprintPhases(segment).length)
 for(const segment of sprints)for(const phase of buildSprintPhases(segment)){const target=resolvePreviewTarget({...segment,...phase,sec:Math.max(1,phase.end-phase.start)},208,PELOTON_BASELINE_EQUIPMENT);assert.match(target.power,/^\d+–\d+ W$/);assert.doesNotMatch(target.power,/maximal/i);const range=target.manualTarget.resolvedResistanceRange;assert.ok(range);for(let resistance=range!.min;resistance<=range!.max;resistance++){const low=estimateBikePower(PELOTON_MANUAL_PROFILE,resistance,target.cadenceRange.min),high=estimateBikePower(PELOTON_MANUAL_PROFILE,resistance,target.cadenceRange.max);assert.ok(high>=target.powerRange.min&&low<=target.powerRange.max)}}
})
