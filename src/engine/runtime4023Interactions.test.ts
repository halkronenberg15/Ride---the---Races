import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getLibraryStage } from '../data/raceLibrary.ts'
import { adaptSegments } from './adaptiveRide.ts'
import { applyDurationSelection, courseDurationOptions, durationSelectionForStage } from './durationEngine.ts'
import { createPreRacePlan, preRaceSnapshot, skipRemainingWarmup } from './preRaceLifecycle.ts'
import { createRoadModel } from './roadModel.ts'
import { canonicalCoursePosition } from './alpha4023.ts'
import { ClimbProfile4023 } from '../components/ClimbProfile4023.ts'
import { ProfileControls4023 } from '../components/ProfileControls4023.ts'
import { CourseEndpointMarkers4023 } from '../components/CourseEndpointMarkers4023.ts'
import { GENERIC_MANUAL_EQUIPMENT } from './manualBike.ts'
import { tacticalOfferSnapshot } from './tacticalLifecycle4023.ts'

const vuelta=getLibraryStage('vuelta-2026',9)!
const worlds=getLibraryStage('worlds-2026',2)!
const scaled=(stage:typeof vuelta,minutes:number)=>applyDurationSelection(adaptSegments(stage.segments,206,'Balanced'),durationSelectionForStage(stage,{mode:'CUSTOM',customMinutes:minutes})).segments

test('every Stage 9 duration traverses warm-up, KM0, GO and racing once without course time',()=>{
 for(const option of courseDurationOptions(vuelta)){
  const plan=createPreRacePlan(scaled(vuelta,option.minutes),option.minutes)
  assert.equal(plan.officialSegments[0].name,'Opening Mountain')
  const checkpoints=[atGate(plan,0),preRaceSnapshot(plan,plan.warmupSeconds-.01),preRaceSnapshot(plan,plan.warmupSeconds),preRaceSnapshot(plan,plan.warmupSeconds+plan.kilometreZeroSeconds),preRaceSnapshot(plan,plan.warmupSeconds+plan.kilometreZeroSeconds+1)]
  assert.deepEqual(checkpoints.map(item=>item.phase),['PRE_RACE_WARMUP','PRE_RACE_WARMUP','KILOMETRE_ZERO','GO','RACING'])
  assert(checkpoints.slice(0,4).every(item=>item.officialElapsed===0))
 }
})
function atGate(plan:ReturnType<typeof createPreRacePlan>,elapsed:number){return preRaceSnapshot(plan,elapsed)}

test('Worlds skip confirmation target is KM0 and repeat skips are idempotent',()=>{
 const plan=createPreRacePlan(worlds.segments,80);assert.equal(plan.warmupSeconds,300);assert.equal(plan.kilometreZeroSeconds,30);assert.equal(plan.officialSegments[0].name,'Brossard Rollout')
 const first=skipRemainingWarmup(plan,83,0),second=skipRemainingWarmup(plan,83,first)
 assert.equal(first,second);const gate=preRaceSnapshot(plan,83,second);assert.equal(gate.phase,'KILOMETRE_ZERO');assert.equal(gate.kilometreZeroRemaining,30);assert.equal(gate.officialElapsed,0)
})


test('full profile endpoint layer renders exactly one semantic KM0 and Finish',()=>{const html=renderToStaticMarkup(createElement(CourseEndpointMarkers4023));assert.equal((html.match(/aria-label="Kilometre Zero"/g)??[]).length,1);assert.equal((html.match(/aria-label="Finish"/g)??[]).length,1);assert.equal((html.match(/KM 0/g)??[]).length,1);assert.equal((html.match(/FINISH/g)??[]).length,1)})

test('Climb View renders one connected source mountain, canonical rider, guidance and five sections',()=>{
 const segments=scaled(vuelta,90),road=createRoadModel(9,createPreRacePlan(segments,90).officialSegments,vuelta.distanceKm,undefined,vuelta.profilePoints,vuelta.officialCourseMarkers,vuelta.raceId,206,GENERIC_MANUAL_EQUIPMENT)
 const climb=road.climbs.at(-1)!,elapsed=road.elapsedAtCourseDistance(climb.startDistance+(climb.summitDistance-climb.startDistance)*.55),position=canonicalCoursePosition(road,elapsed)
 const html=renderToStaticMarkup(createElement(ClimbProfile4023,{model:road,position,currentResistance:'53–54%',nextResistance:'48–51%',formatDistance:(km:number)=>`${km.toFixed(1)} km`,formatTime:(seconds:number)=>`${Math.ceil(seconds)}s`}))
 assert.match(html,/Continuous colored climb mountain/);assert.match(html,/class="climb-rider"/);assert.match(html,/CURRENT/);assert.match(html,/53–54% resistance/);assert.match(html,/NEXT/);assert.match(html,/CHANGE IN/);assert.equal((html.match(/<g class=/g)??[]).length<=5,true);assert.doesNotMatch(html,/gradient-block|height:/)
 const later=canonicalCoursePosition(road,road.elapsedAtCourseDistance(climb.startDistance+(climb.summitDistance-climb.startDistance)*.7));assert((later.climbCoordinate??0)>(position.climbCoordinate??0))
})

function buttons(node:ReactNode):ReactElement<{onClick:()=>void;'aria-label'?:string}>[]{if(!node||typeof node==='string'||typeof node==='number')return[];if(Array.isArray(node))return node.flatMap(buttons);const item=node as ReactElement<{children?:ReactNode;onClick?:()=>void}>;return [item.type==='button'?[item as ReactElement<{onClick:()=>void;'aria-label'?:string}>]:[],...buttons(item.props.children)].flat()}
test('profile controls perform reversible Detail and geographic interactions',()=>{
 let geographic:'FULL_STAGE'|'CLIMB'='FULL_STAGE',density:'OVERVIEW'|'DETAIL'='OVERVIEW'
 const render=()=>ProfileControls4023({climbAvailable:true,geographicMode:geographic,density,onGeographicMode:value=>{geographic=value},onDensity:value=>{density=value}})
 let controls=buttons(render());controls.find(button=>button.props['aria-label']==='Show Detail')!.props.onClick();assert.equal(density,'DETAIL');assert.match(renderToStaticMarkup(render()),/SHOW OVERVIEW/)
 controls=buttons(render());controls.find(button=>button.props['aria-label']==='Show Climb')!.props.onClick();assert.equal(geographic,'CLIMB');assert.match(renderToStaticMarkup(render()),/SHOW FULL STAGE/)
 controls=buttons(render());controls.find(button=>button.props['aria-label']==='Show Full Stage')!.props.onClick();assert.equal(geographic,'FULL_STAGE');assert.equal(density,'DETAIL');buttons(render()).find(button=>button.props['aria-label']==='Show Overview')!.props.onClick();assert.equal(density,'OVERVIEW')
})

test('20-second tactical clock expires once and decisions consume immediately',()=>{
 assert.deepEqual(tacticalOfferSnapshot(100,100),{state:'OFFERED',remaining:20,consumed:false});assert.equal(tacticalOfferSnapshot(100,119).remaining,1);assert.deepEqual(tacticalOfferSnapshot(100,120),{state:'EXPIRED',remaining:0,consumed:true});assert.equal(tacticalOfferSnapshot(100,105,'accepted').state,'ACCEPTED');assert.equal(tacticalOfferSnapshot(100,105,'declined').state,'DECLINED')
})
