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
import { WorldsOverviewLabels, ProfileDetail4022 } from '../components/WorldsRaceLayer.ts'
import { RiderMarker4023 } from '../components/RiderMarker4023.ts'
import { targetPreview4023 } from './targetPreview4023.ts'
import { courseContextLabel } from './alpha4023.ts'

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


test('Worlds hub thumbnail retains only one compact Mount Royal callout at mobile widths',()=>{for(const width of [320,375,390,430]){const html=renderToStaticMarkup(createElement('div',{style:{width}},createElement(WorldsOverviewLabels)));assert.equal((html.match(/12× MOUNT ROYAL/g)??[]).length,1);assert.doesNotMatch(html,/SOUTH SHORE|BRIDGE|AVENUE DU PARC/)}})

test('Detail replaces overview with readable context and footer remains a separate interaction',()=>{let density:'OVERVIEW'|'DETAIL'='OVERVIEW';const detail=()=>density==='DETAIL'?renderToStaticMarkup(createElement(ProfileDetail4022,{state:{mode:density,activeRangeId:'manual',autoConsumedIds:[]},progress:.2,gradientBlocks:[],gradientIndex:0,currentGradient:-3.2,nextGradient:1.8,nextName:'South Shore Positioning',changeDistance:'0.4 mi',resistance:'38–41%',context:'Brossard Rollout · Descent'})): '<svg aria-label="Overview course"></svg>';assert.match(detail(),/Overview course/);density='DETAIL';const html=detail();assert.doesNotMatch(html,/Overview course/);assert.match(html,/CURRENT/);assert.match(html,/POSITION/);assert.match(html,/Brossard Rollout · Descent/);assert.match(html,/38–41%/);const controls=renderToStaticMarkup(createElement(ProfileControls4023,{climbAvailable:false,geographicMode:'FULL_STAGE',density,onGeographicMode:()=>{},onDensity:value=>{density=value}}));assert.match(controls,/SHOW OVERVIEW/);assert.doesNotMatch(html,/SHOW OVERVIEW/)})

test('Climb Approach labels the first section upcoming with resolved resistance and zero progress',()=>{const segments=scaled(vuelta,90),road=createRoadModel(9,createPreRacePlan(segments,90).officialSegments,vuelta.distanceKm,undefined,vuelta.profilePoints,vuelta.officialCourseMarkers,vuelta.raceId,206,GENERIC_MANUAL_EQUIPMENT),climb=road.climbs[0],position=canonicalCoursePosition(road,road.elapsedAtCourseDistance(climb.startDistance+.00001));const html=renderToStaticMarkup(createElement(ClimbProfile4023,{model:road,position,approach:true,currentResistance:position.currentTargets.resistance.replace(/ · START.*$/i,''),nextResistance:'48–51%',formatDistance:(km:number)=>`${km.toFixed(1)} mi`,formatTime:(seconds:number)=>`${seconds}s`}));assert.match(html,/CLIMB START/);assert.match(html,/>0%/);assert.doesNotMatch(html,/— resistance/);assert.match(html,/data-course-coordinate="0.000000"/)})

test('canonical gradient boundary promotes values atomically and never renders 0.0 distance',()=>{const segments=scaled(vuelta,90),road=createRoadModel(9,createPreRacePlan(segments,90).officialSegments,vuelta.distanceKm,undefined,vuelta.profilePoints,vuelta.officialCourseMarkers,vuelta.raceId,206,GENERIC_MANUAL_EQUIPMENT),climb=road.climbs.at(-1)!,entrance=canonicalCoursePosition(road,road.elapsedAtCourseDistance(climb.startDistance+.001)),boundaryProgress=entrance.gradientSections[1].start,boundaryKm=climb.startDistance+(climb.summitDistance-climb.startDistance)*boundaryProgress,atElapsed=road.elapsedAtCourseDistance(boundaryKm),before=canonicalCoursePosition(road,atElapsed-.0001),at=canonicalCoursePosition(road,atElapsed),after=canonicalCoursePosition(road,atElapsed+.0001);assert((before.distanceToNextGradientBoundary??0)>0);assert.equal(at.gradientBoundaryCrossing,true);assert.notEqual(before.currentGradientSection?.gradient,at.currentGradientSection?.gradient);assert.equal(after.currentGradientSection?.gradient,at.currentGradientSection?.gradient);const html=renderToStaticMarkup(createElement(ClimbProfile4023,{model:road,position:at,currentResistance:'53–54%',nextResistance:'55–58%',formatDistance:(km:number)=>`${km.toFixed(1)} mi`,formatTime:String}));assert.match(html,/CHANGE/);assert.match(html,/>NOW</);assert.doesNotMatch(html,/0\.0 mi/)})

test('future previews equal activation resolver targets for KM0 and normal sections',()=>{const plan=createPreRacePlan(worlds.segments,80),kmModel=createRoadModel(-2,[{...plan.warmupSegment,name:'KILOMETRE ZERO',type:'Race start',zone:'Z2',power:'60–72% FTP'}],1,undefined,undefined,undefined,'KM0',206,GENERIC_MANUAL_EQUIPMENT),kmActive=kmModel.roadSnapshot(0).livePrescription,kmPreview=targetPreview4023('KILOMETRE ZERO',plan.kilometreZeroSeconds,kmActive);assert.deepEqual({power:kmPreview.power,cadence:kmPreview.cadence,resistance:kmPreview.openingResistance},{power:kmActive.power,cadence:kmActive.cadence,resistance:kmActive.manualTarget.recommendedResistance});const road=createRoadModel(2,plan.officialSegments,worlds.distanceKm,undefined,worlds.profilePoints,worlds.officialCourseMarkers,worlds.raceId,206,GENERIC_MANUAL_EQUIPMENT),nextIndex=1,nextActive=road.roadSnapshot(road.segmentStarts[nextIndex]).livePrescription,nextPreview=targetPreview4023(plan.officialSegments[nextIndex].name,plan.officialSegments[nextIndex].sec,nextActive);assert.equal(nextPreview.power,nextActive.power);assert.equal(nextPreview.cadence,nextActive.cadence);assert.equal(nextPreview.openingResistance,nextActive.manualTarget.recommendedResistance)})

test('rider faces right without transforming canonical coordinates at all checkpoints',()=>{for(const coordinate of [0,.0001,.5,.9999,1]){const html=renderToStaticMarkup(createElement(RiderMarker4023,{kind:'profile',left:coordinate*100,top:50,coordinate}));assert.match(html,/data-direction="right"/);assert.match(html,/Rider facing right/);assert.match(html,new RegExp(`data-course-coordinate="${coordinate.toFixed(6)}"`))}})

test('full-stage context follows authored sector and material descent',()=>{assert.equal(courseContextLabel('Mountain Chain Two',-6.2),'Mountain Chain Two · Descent');assert.equal(courseContextLabel('Aitana Approach',1.2),'Aitana Approach · Approach');assert.equal(courseContextLabel('Central Valley',.2),'Central Valley')})
