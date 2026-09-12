import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { getLibraryStage } from '../data/raceLibrary.ts'
import { adaptSegments } from './adaptiveRide.ts'
import { applyDurationSelection, courseDurationOptions, durationSelectionForStage } from './durationEngine.ts'
import { createPreRacePlan, preRaceSnapshot, skipRemainingWarmup } from './preRaceLifecycle.ts'
import { createRoadModel } from './roadModel.ts'
import { canonicalCoursePosition } from './alpha4023.ts'
import { ClimbProfile4023 } from '../components/ClimbProfile4023.ts'
import { ProfileControls4023 } from '../components/ProfileControls4023.ts'
import { CourseEndpointMarkers4023, CourseFinishMarker4023 } from '../components/CourseEndpointMarkers4023.ts'
import { GENERIC_MANUAL_EQUIPMENT, bikeProfileForEquipment } from './manualBike.ts'
import { tacticalOfferSnapshot } from './tacticalLifecycle4023.ts'
import { WorldsOverviewLabels, ProfileDetail4022, LiveTrackerHeader4023, WorldsGroupMarkers, TacticalStatusStrip, situationGroups } from '../components/WorldsRaceLayer.ts'
import { RiderMarker4023 } from '../components/RiderMarker4023.ts'
import { targetPreview4023 } from './targetPreview4023.ts'
import { completionLabel, lifecycleJeanMessage, lifecycleProfileContext, resolveDetailGuidance4023 } from './cockpitPresentation4023.ts'
import { courseContextLabel } from './alpha4023.ts'
import { chaseLifecycle, montrealRoadStory } from './alpha4022.ts'
import { tacticalPrescription } from './alpha4021.ts'
import { resolveTacticalTransition } from './tacticalActions.ts'

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

test('Stage 9 briefing timeline extracts its scaled 8:15 warm-up and numbers Opening Mountain first',()=>{const plan=createPreRacePlan(scaled(vuelta,90),90);assert.equal(plan.warmupSegment.name,'Villajoyosa Rollout');assert.equal(plan.warmupSeconds,8*60+15);assert.equal(plan.kilometreZeroSeconds,45);assert.equal(plan.officialSegments[0].name,'Opening Mountain');assert.equal(plan.officialSegments.some(segment=>segment.name==='Villajoyosa Rollout'),false)})

test('Worlds skip confirmation target is KM0 and repeat skips are idempotent',()=>{
 const plan=createPreRacePlan(worlds.segments,80);assert.equal(plan.warmupSeconds,300);assert.equal(plan.kilometreZeroSeconds,30);assert.equal(plan.officialSegments[0].name,'Brossard Rollout')
 const first=skipRemainingWarmup(plan,83,0),second=skipRemainingWarmup(plan,83,first)
 assert.equal(first,second);const gate=preRaceSnapshot(plan,83,second);assert.equal(gate.phase,'KILOMETRE_ZERO');assert.equal(gate.kilometreZeroRemaining,30);assert.equal(gate.officialElapsed,0)
})


test('course endpoints keep KM0 separate and anchor Finish at the final SVG sample',()=>{const start=renderToStaticMarkup(createElement(CourseEndpointMarkers4023)),finish=renderToStaticMarkup(createElement('svg',null,createElement(CourseFinishMarker4023,{y:37.5})));assert.equal((start.match(/aria-label="Kilometre Zero"/g)??[]).length,1);assert.equal((finish.match(/aria-label="Finish"/g)??[]).length,1);assert.match(finish,/data-endpoint-x="100"/);assert.match(finish,/data-endpoint-y="37.500"/);assert.match(finish,/x1="100" y1="37.5"/)})

test('Climb Overview renders one connected source mountain without duplicate gradient guidance',()=>{
 const segments=scaled(vuelta,90),road=createRoadModel(9,createPreRacePlan(segments,90).officialSegments,vuelta.distanceKm,undefined,vuelta.profilePoints,vuelta.officialCourseMarkers,vuelta.raceId,206,GENERIC_MANUAL_EQUIPMENT)
 const climb=road.climbs.at(-1)!,elapsed=road.elapsedAtCourseDistance(climb.startDistance+(climb.summitDistance-climb.startDistance)*.55),position=canonicalCoursePosition(road,elapsed)
 const html=renderToStaticMarkup(createElement(ClimbProfile4023,{model:road,position,currentResistance:'53–54%',nextResistance:'48–51%',formatDistance:(km:number)=>`${km.toFixed(1)} km`,formatTime:(seconds:number)=>`${Math.ceil(seconds)}s`}))
 assert.match(html,/Continuous colored climb mountain/);assert.match(html,/class="climb-rider"/);assert.match(html,/CLIMB/);assert.match(html,/TO SUMMIT/);assert.doesNotMatch(html,/CURRENT|NEXT|CHANGE IN|resistance/);assert.equal((html.match(/<g class=/g)??[]).length<=5,true);assert.doesNotMatch(html,/gradient-block|height:/)
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

test('Detail replaces overview with readable context and footer remains a separate interaction',()=>{let density:'OVERVIEW'|'DETAIL'='OVERVIEW';const detail=()=>density==='DETAIL'?renderToStaticMarkup(createElement(ProfileDetail4022,{state:{mode:density,activeRangeId:'manual',autoConsumedIds:[]},gradientBlocks:[],gradientIndex:0,currentGradient:-3.2,nextGradient:1.8,nextName:'South Shore Positioning',changeDistance:'0.4 mi',resistance:'38–41%',context:'Brossard Rollout · Descent'})): '<svg aria-label="Overview course"></svg>';assert.match(detail(),/Overview course/);density='DETAIL';const html=detail();assert.doesNotMatch(html,/Overview course/);assert.match(html,/CURRENT/);assert.match(html,/POSITION/);assert.match(html,/Brossard Rollout · Descent/);assert.match(html,/38–41%/);const controls=renderToStaticMarkup(createElement(ProfileControls4023,{climbAvailable:false,geographicMode:'FULL_STAGE',density,onGeographicMode:()=>{},onDensity:value=>{density=value}}));assert.match(controls,/SHOW OVERVIEW/);assert.doesNotMatch(html,/SHOW OVERVIEW/)})

test('Climb Approach overview holds canonical rider at zero without gradient cards',()=>{const segments=scaled(vuelta,90),road=createRoadModel(9,createPreRacePlan(segments,90).officialSegments,vuelta.distanceKm,undefined,vuelta.profilePoints,vuelta.officialCourseMarkers,vuelta.raceId,206,GENERIC_MANUAL_EQUIPMENT),climb=road.climbs[0],position=canonicalCoursePosition(road,road.elapsedAtCourseDistance(climb.startDistance+.00001));const html=renderToStaticMarkup(createElement(ClimbProfile4023,{model:road,position,approach:true,currentResistance:position.currentTargets.resistance.replace(/ · START.*$/i,''),nextResistance:'48–51%',formatDistance:(km:number)=>`${km.toFixed(1)} mi`,formatTime:(seconds:number)=>`${seconds}s`}));assert.match(html,/CLIMB 0%/);assert.doesNotMatch(html,/CURRENT|NEXT|CHANGE IN|resistance/);assert.match(html,/data-course-coordinate="0.000000"/)})

test('canonical gradient boundary promotes values atomically and never renders 0.0 distance',()=>{const segments=scaled(vuelta,90),road=createRoadModel(9,createPreRacePlan(segments,90).officialSegments,vuelta.distanceKm,undefined,vuelta.profilePoints,vuelta.officialCourseMarkers,vuelta.raceId,206,GENERIC_MANUAL_EQUIPMENT),climb=road.climbs.at(-1)!,entrance=canonicalCoursePosition(road,road.elapsedAtCourseDistance(climb.startDistance+.001)),boundaryProgress=entrance.gradientSections[1].start,boundaryKm=climb.startDistance+(climb.summitDistance-climb.startDistance)*boundaryProgress,atElapsed=road.elapsedAtCourseDistance(boundaryKm),before=canonicalCoursePosition(road,atElapsed-.0001),at=canonicalCoursePosition(road,atElapsed),after=canonicalCoursePosition(road,atElapsed+.0001);assert((before.distanceToNextGradientBoundary??0)>0);assert.equal(at.gradientBoundaryCrossing,true);assert.notEqual(before.currentGradientSection?.gradient,at.currentGradientSection?.gradient);assert.equal(after.currentGradientSection?.gradient,at.currentGradientSection?.gradient);const html=renderToStaticMarkup(createElement(ProfileDetail4022,{state:{mode:'DETAIL',activeRangeId:'boundary',autoConsumedIds:[]},gradientBlocks:[],gradientIndex:0,currentGradient:at.currentGradientSection!.gradient,nextGradient:at.nextGradientSection?.gradient??null,changeDistance:'CHANGE NOW',resistance:at.currentTargets.resistance,context:at.currentSector}));assert.match(html,/CHANGE/);assert.match(html,/>NOW</);assert.doesNotMatch(html,/0\.0 mi/)})

test('future previews equal activation resolver targets for KM0 and normal sections',()=>{const plan=createPreRacePlan(worlds.segments,80),kmModel=createRoadModel(-2,[{...plan.warmupSegment,name:'KILOMETRE ZERO',type:'Race start',zone:'Z2',power:'60–72% FTP'}],1,undefined,undefined,undefined,'KM0',206,GENERIC_MANUAL_EQUIPMENT),kmActive=kmModel.roadSnapshot(0).livePrescription,kmPreview=targetPreview4023('KILOMETRE ZERO',plan.kilometreZeroSeconds,kmActive);assert.deepEqual({power:kmPreview.power,cadence:kmPreview.cadence,resistance:kmPreview.openingResistance},{power:kmActive.power,cadence:kmActive.cadence,resistance:kmActive.manualTarget.recommendedResistance});const road=createRoadModel(2,plan.officialSegments,worlds.distanceKm,undefined,worlds.profilePoints,worlds.officialCourseMarkers,worlds.raceId,206,GENERIC_MANUAL_EQUIPMENT),nextIndex=1,nextActive=road.roadSnapshot(road.segmentStarts[nextIndex]).livePrescription,nextPreview=targetPreview4023(plan.officialSegments[nextIndex].name,plan.officialSegments[nextIndex].sec,nextActive);assert.equal(nextPreview.power,nextActive.power);assert.equal(nextPreview.cadence,nextActive.cadence);assert.equal(nextPreview.openingResistance,nextActive.manualTarget.recommendedResistance)})

test('rider faces right without transforming canonical coordinates at all checkpoints',()=>{for(const coordinate of [0,.0001,.5,.9999,1]){const html=renderToStaticMarkup(createElement(RiderMarker4023,{kind:'profile',left:coordinate*100,top:50,coordinate}));assert.match(html,/data-direction="right"/);assert.match(html,/Rider facing right/);assert.match(html,new RegExp(`data-course-coordinate="${coordinate.toFixed(6)}"`))}})

test('full-stage context follows authored sector and material descent',()=>{assert.equal(courseContextLabel('Mountain Chain Two',-6.2),'Mountain Chain Two · Descent');assert.equal(courseContextLabel('Aitana Approach',1.2),'Aitana Approach · Approach');assert.equal(courseContextLabel('Central Valley',.2),'Central Valley')})

test('lifecycle presentation freezes pre-race context and selects exactly one current Jean message',()=>{
 const racing='Opening Mountain'
 assert.equal(lifecycleProfileContext(false,'PRE_RACE_WARMUP',racing),'READY')
 assert.equal(lifecycleProfileContext(true,'PRE_RACE_WARMUP',racing),'PRE-RACE STAGING')
 assert.equal(lifecycleProfileContext(true,'KILOMETRE_ZERO',racing),'KILOMETRE ZERO')
 assert.equal(lifecycleProfileContext(true,'GO',racing),'GO')
 assert.equal(lifecycleProfileContext(true,'RACING',racing),racing)
 const messages=['PRE_RACE_WARMUP','KILOMETRE_ZERO','GO','RACING'].map(phase=>lifecycleJeanMessage(true,phase as Parameters<typeof lifecycleJeanMessage>[1],'Race instruction'))
 assert.deepEqual(messages,['Open the legs progressively. We race after Kilometre Zero.','Hold the line. Build only when I call GO.','GO. The race is live.','Race instruction'])
 assert(messages.every(message=>!message.includes('Press Start Ride')))
 assert.equal(lifecycleJeanMessage(true,'RACING','Kilometre Zero. Hold position and prepare for GO.'),'Race is live. Settle into the opening section.')
})

test('Jean replaces ready copy on the active-warmup edge and after warmup restoration',()=>{const ready=lifecycleJeanMessage(false,undefined,'stale'),started=lifecycleJeanMessage(true,'PRE_RACE_WARMUP',ready),restored=lifecycleJeanMessage(true,'PRE_RACE_WARMUP','Radio connected. Press Start Ride when you are ready.');assert.match(ready,/Press Start Ride/);assert.equal(started,'Open the legs progressively. We race after Kilometre Zero.');assert.equal(restored,started);assert.doesNotMatch(`${started} ${restored}`,/Press Start Ride/)})

test('profile controls render compact contrasting buttons and switch both independent modes',()=>{
 let geographic:'FULL_STAGE'|'CLIMB'='FULL_STAGE',density:'OVERVIEW'|'DETAIL'='OVERVIEW'
 const render=()=>ProfileControls4023({climbAvailable:true,geographicMode:geographic,density,onGeographicMode:value=>{geographic=value},onDensity:value=>{density=value}})
 for(const width of [320,375,390,430]){const html=renderToStaticMarkup(createElement('div',{style:{width}},render()));assert.equal((html.match(/<button/g)??[]).length,2);assert.match(html,/background:#512000;color:#ffffff/);assert.doesNotMatch(html,/disabled|<button[^>]*><\/button>/)}
 buttons(render()).find(button=>button.props['aria-label']==='Show Climb')!.props.onClick();assert.equal(geographic,'CLIMB');assert.match(renderToStaticMarkup(render()),/SHOW FULL STAGE/)
 buttons(render()).find(button=>button.props['aria-label']==='Show Detail')!.props.onClick();assert.equal(density,'DETAIL');assert.equal(geographic,'CLIMB');assert.match(renderToStaticMarkup(render()),/SHOW OVERVIEW/)
})

test('completion communicates initial canonical movement without rounding back to zero',()=>{
 assert.equal(completionLabel(0,0),'0% COMPLETE');assert.equal(completionLabel(.3,.5),'<1% COMPLETE');assert.equal(completionLabel(1.2,2),'1% COMPLETE');assert.equal(completionLabel(99.9,1),'99% COMPLETE')
})

test('every Stage 9 transition preview reuses its activation prescription including climb descent and cooldown',()=>{
 const segments=scaled(vuelta,90),plan=createPreRacePlan(segments,90),road=createRoadModel(9,plan.officialSegments,vuelta.distanceKm,undefined,vuelta.profilePoints,vuelta.officialCourseMarkers,vuelta.raceId,206,GENERIC_MANUAL_EQUIPMENT)
 for(let index=0;index<plan.officialSegments.length;index++){const segment=plan.officialSegments[index],active=road.roadSnapshot(road.segmentStarts[index]).livePrescription,preview=targetPreview4023(segment.name,segment.sec,active);assert.equal(preview.name,segment.name);assert.equal(preview.remaining,segment.sec);assert.equal(preview.power,active.power);assert.equal(preview.cadence,active.cadence);assert.equal(preview.openingResistance,active.manualTarget.recommendedResistance)}
 assert(plan.officialSegments.some(segment=>/climb|mountain/i.test(segment.name)));assert(plan.officialSegments.some(segment=>/descent/i.test(segment.name)));assert(plan.officialSegments.some(segment=>/cooldown/i.test(segment.type)))
})

test('unified tracker stays one semantic row with section and zone at every mobile width',()=>{for(const width of [320,375,390,430]){const html=renderToStaticMarkup(createElement('div',{style:{width}},createElement(LiveTrackerHeader4023,{worlds:width%2===0,section:'Mountain Chain One',zone:'Z3–Z4'})));assert.equal((html.match(/<header/g)??[]).length,1);assert.match(html,/LIVE (?:RACE|STAGE) TRACKER/);assert.match(html,/Mountain Chain One/);assert.match(html,/Z3–Z4/);assert.doesNotMatch(html,/<br|overflow-x/)}})

test('Worlds profile markers render bounded compact B and P semantics',()=>{const event=montrealRoadStory[2];for(const width of [320,375,390,430]){const html=renderToStaticMarkup(createElement(WorldsGroupMarkers,{event,courseProgress:.01,pixelWidth:width}));assert.match(html,/aria-label="BREAKAWAY"/);assert.match(html,/>B<\/b>/);assert.match(html,/aria-label="PELOTON"/);assert.match(html,/>P<\/b>/);assert.doesNotMatch(html,/>BREAK<|>PELOTON</)}})

test('endpoint layer reduces KM0 after movement',()=>{const start=renderToStaticMarkup(createElement(CourseEndpointMarkers4023,{progress:0})),moving=renderToStaticMarkup(createElement(CourseEndpointMarkers4023,{progress:.01}));assert.equal((start.match(/KM 0/g)??[]).length,1);assert.equal((moving.match(/KM 0/g)??[]).length,0);assert.match(moving,/start compact/)})

test('Worlds KM0 Detail uses staging prescription, countdown and first official section',()=>{const state={mode:'DETAIL' as const,activeRangeId:'km0',autoConsumedIds:[]};const html=renderToStaticMarkup(createElement(ProfileDetail4022,{state,gradientBlocks:[],gradientIndex:0,currentGradient:0,nextGradient:null,nextName:'Brossard Rollout',changeDistance:'00:28',resistance:'38–41%',context:'Kilometre Zero'}));assert.match(html,/0\.0% FLAT/);assert.match(html,/Brossard Rollout/);assert.match(html,/00:28/);assert.match(html,/38–41%/);assert.match(html,/Kilometre Zero/);assert.doesNotMatch(html,/Avenue du Parc Finish|CHANGE NOW/)})

test('accepted attack keeps ATTACK identity and identical controlled-timestamp targets',()=>{const road=createRoadModel(9,createPreRacePlan(scaled(vuelta,90),90).officialSegments,vuelta.distanceKm,undefined,vuelta.profilePoints,vuelta.officialCourseMarkers,vuelta.raceId,206,GENERIC_MANUAL_EQUIPMENT),base=road.roadSnapshot(900).livePrescription,multiplier=1.12,preview=tacticalPrescription(base,multiplier,GENERIC_MANUAL_EQUIPMENT,bikeProfileForEquipment(GENERIC_MANUAL_EQUIPMENT)),active=tacticalPrescription(base,multiplier,GENERIC_MANUAL_EQUIPMENT,bikeProfileForEquipment(GENERIC_MANUAL_EQUIPMENT));assert.deepEqual({power:active.power,cadence:active.cadence,resistance:active.resistance},{power:preview.power,cadence:preview.cadence,resistance:preview.resistance});const html=renderToStaticMarkup(createElement(TacticalStatusStrip,{state:'ACTIVE',action:'ATTACK',remaining:60}));assert.match(html,/ATTACK ACTIVE · 60s/);assert.doesNotMatch(html,/CHASE ACTIVE/)})

test('connected Worlds Detail path never substitutes Finish for a missing gradient boundary',()=>{const plan=createPreRacePlan(worlds.segments,80),road=createRoadModel(2,plan.officialSegments,worlds.distanceKm,undefined,worlds.profilePoints,worlds.officialCourseMarkers,worlds.raceId,206,GENERIC_MANUAL_EQUIPMENT),position=canonicalCoursePosition(road,road.elapsedAtCourseDistance(worlds.distanceKm*.07)),guidance=resolveDetailGuidance4023(position.nextGradientSection?.gradient??null,position.distanceToNextGradientBoundary,position.gradientBoundaryCrossing),html=renderToStaticMarkup(createElement(ProfileDetail4022,{state:{mode:'DETAIL',activeRangeId:'road',autoConsumedIds:[]},gradientBlocks:position.gradientSections,gradientIndex:0,currentGradient:position.currentGradientSection?.gradient??0,nextGradient:guidance.gradient,nextName:guidance.name,changeDistance:guidance.distanceKm===null?null:`${guidance.distanceKm.toFixed(1)} mi`,resistance:position.currentTargets.resistance,context:position.currentSector}));assert.doesNotMatch(html,/Avenue du Parc Finish|157\.4 mi|168\.5 mi/);if(guidance.distanceKm===null){assert.match(html,/NO UPCOMING GRADIENT CHANGE/);assert.doesNotMatch(html,/CHANGE IN/)}else{assert.match(html,/NEXT GRADIENT/);assert(guidance.distanceKm<worlds.distanceKm-position.fullProfileCoordinate*worlds.distanceKm)}})

test('Detail omits internal profile-window position from visible and accessible output',()=>{const html=renderToStaticMarkup(createElement(ProfileDetail4022,{state:{mode:'DETAIL',activeRangeId:'road',autoConsumedIds:[]},gradientBlocks:[],gradientIndex:0,currentGradient:0,nextGradient:null,nextName:'NO UPCOMING GRADIENT CHANGE',changeDistance:null,resistance:'38–41%',context:'South Shore Positioning'}));assert.doesNotMatch(html,/POSITION IN VIEW/i);assert.match(html,/South Shore Positioning/)})

test('Finish label is solid, backed and contained without Safari-distorting text strokes',()=>{const html=renderToStaticMarkup(createElement('svg',null,createElement(CourseFinishMarker4023,{y:42}))),textTag=html.match(/<text[^>]*>/)?.[0]??'',styles=`${readFileSync(new URL('../App.css',import.meta.url),'utf8')} ${readFileSync(new URL('../screens/RideScreen.tsx',import.meta.url),'utf8')}`;assert.match(html,/<rect[^>]*fill="rgba\(5,5,5,\.78\)"/);assert.match(textTag,/x="97"/);assert.match(textTag,/fill="#ffffff"/);assert.doesNotMatch(textTag,/stroke|paint-order|paintOrder/);assert.doesNotMatch(styles,/paint-order|course-finish-svg text\{[^}]*stroke/);assert.match(html,/data-endpoint-x="100"/);assert.match(html,/x1="100" y1="42"/)})

test('KM0 label offsets without moving its canonical tick',()=>{const html=renderToStaticMarkup(createElement(CourseEndpointMarkers4023,{progress:0}));assert.match(html,/left:8px;bottom:22px/);assert.match(html,/class="profile-end-marker start"/);assert.match(html,/<i><\/i>/)})

test('Return to Peloton clears once at zero and restores ordinary prescription',()=>{const before=resolveTacticalTransition('RETURNING_TO_PELOTON',{startedAt:100,durationSeconds:45,from:'ATTACKING',progress:0},144.99),at=resolveTacticalTransition('RETURNING_TO_PELOTON',{startedAt:100,durationSeconds:45,from:'ATTACKING',progress:0},145),after=resolveTacticalTransition(at.state,at.transition,146);assert.equal(before.state,'RETURNING_TO_PELOTON');assert.equal(at.state,'PELOTON');assert.equal(at.transition,null);assert.equal(at.effortMultiplier,1);assert.deepEqual(after,at);assert.equal(renderToStaticMarkup(createElement(TacticalStatusStrip,{state:'RETURNING',remaining:0})).match(/RETURNING TO PELOTON/g)?.length,1)})

test('Worlds rider remains grouped with Peloton until an authored Chase becomes active',()=>{const event=montrealRoadStory[2],grouped=situationGroups(event,.3,'PELOTON'),chasing=situationGroups(event,.3,'CHASING');assert.equal(grouped.find(group=>group.id==='peloton')?.position,.3);assert((chasing.find(group=>group.id==='peloton')?.position??.3)<.3);const html=renderToStaticMarkup(createElement(WorldsGroupMarkers,{event,courseProgress:.3,riderState:'CHASING'}));assert.match(html,/aria-label="CHASE GROUP"/);assert.match(html,/>C<\/b>/)})

test('authored Worlds Chase preserves identity, targets and one return lifecycle',()=>{const event=montrealRoadStory.find(item=>item.actions.includes('CHASE'))!,plan=createPreRacePlan(worlds.segments,80),road=createRoadModel(2,plan.officialSegments,worlds.distanceKm,undefined,worlds.profilePoints,worlds.officialCourseMarkers,worlds.raceId,206,GENERIC_MANUAL_EQUIPMENT),elapsed=road.elapsedAtCourseDistance(event.trigger*worlds.distanceKm),base=road.roadSnapshot(elapsed).livePrescription,preview=tacticalPrescription(base,event.preview.powerMultiplier,GENERIC_MANUAL_EQUIPMENT,bikeProfileForEquipment(GENERIC_MANUAL_EQUIPMENT)),active=tacticalPrescription(base,event.preview.powerMultiplier,GENERIC_MANUAL_EQUIPMENT,bikeProfileForEquipment(GENERIC_MANUAL_EQUIPMENT));assert.deepEqual({power:active.power,cadence:active.cadence,resistance:active.resistance},{power:preview.power,cadence:preview.cadence,resistance:preview.resistance});assert.equal(chaseLifecycle({decision:'accepted',activeStartedAt:elapsed,effortDurationSeconds:60,elapsed:elapsed+59.9}),'ACTIVE');assert.equal(chaseLifecycle({decision:'accepted',activeStartedAt:elapsed,effortDurationSeconds:60,returnStartedAt:elapsed+60,elapsed:elapsed+60}),'RETURNING');assert.equal(chaseLifecycle({decision:'accepted',activeStartedAt:elapsed,effortDurationSeconds:60,returnStartedAt:elapsed+60,elapsed:elapsed+105}),'COMPLETE');const html=renderToStaticMarkup(createElement(TacticalStatusStrip,{state:'ACTIVE',action:'CHASE',remaining:60}));assert.match(html,/CHASE ACTIVE/);assert.doesNotMatch(html,/ATTACK ACTIVE/)})
