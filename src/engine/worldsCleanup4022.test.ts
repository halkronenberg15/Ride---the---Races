import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CalibrationHelper, ChaseDecisionCard, LiveTrackerLabel, ProfileDetail4022, WorldsGroupMarkers, WorldsOverviewLabels } from '../components/WorldsRaceLayer.ts'
import { ROAD_RACE_MISSION, ROAD_RACE_SUPPORT, worldsStage } from '../data/uciWorlds2026.ts'
import { montrealRoadStory, mountRoyalLap, synchronizeProfileView } from './alpha4022.ts'
import { createRoadModel } from './roadModel.ts'
import { raceIdentities } from '../data/raceLibrary.ts'

test('Worlds rider-facing layers omit engineering terminology',()=>{const state=synchronizeProfileView({mode:'OVERVIEW',activeRangeId:null,autoConsumedIds:[]},montrealRoadStory[2]);const html=[renderToStaticMarkup(createElement(WorldsGroupMarkers,{event:montrealRoadStory[2],courseProgress:.3})),renderToStaticMarkup(createElement(ChaseDecisionCard,{event:montrealRoadStory[2],active:false,onAccept:()=>{},onHold:()=>{}})),renderToStaticMarkup(createElement(ProfileDetail4022,{state,event:montrealRoadStory[2],progress:.2,gradientBlocks:[{start:0,end:1,gradient:2}],gradientIndex:0,currentGradient:2,nextGradient:null,distanceToTransition:1,resistance:'40–42%'}))].join(' ');assert.doesNotMatch(html,/authored|canonical|deterministic|event-scoped|simulation contract|telemetry/i)})
test('Road Race mission and support copy are immersive',()=>{assert.equal(worldsStage('road').objective,'Race patiently across the South Shore, stay protected into Montréal, then survive the repeated Mount Royal selections.');assert.equal(ROAD_RACE_MISSION,worldsStage('road').objective);assert.equal(ROAD_RACE_SUPPORT,'Watch the break, respond when the race becomes dangerous, and save enough for the final Avenue du Parc drive.')})
test('neither Worlds event resolves or awards classification markers',()=>{for(const kind of ['itt','road'] as const){const stage=worldsStage(kind),model=createRoadModel(stage.number,stage.segments,stage.distanceKm,raceIdentities['worlds-2026'],stage.profilePoints,stage.officialCourseMarkers,stage.raceId);assert.equal(model.markers.some(marker=>marker.type==='sprint'||marker.type==='kom'),false);assert.equal(model.markers.some(marker=>(marker.points??0)>0),false)}})
test('Overview communicates one compressed twelve-lap circuit region',()=>{const html=renderToStaticMarkup(createElement(WorldsOverviewLabels));assert.match(html,/SOUTH SHORE/);assert.match(html,/BRIDGE/);assert.match(html,/12× MOUNT ROYAL/);assert.match(html,/AVENUE DU PARC/)})
test('distance lap mapping still exposes all twelve laps',()=>{assert.deepEqual(Array.from({length:12},(_,index)=>mountRoyalLap(112.9+index*13.4+.01)),Array.from({length:12},(_,index)=>index+1))})
test('calibration helper renders dynamic concise values',()=>{const html=renderToStaticMarkup(createElement(CalibrationHelper,{resistance:41,cadence:93,guidance:'LOW: +1 · HIGH: −1'}));assert.match(html,/START 41% @ 93 RPM/);assert.match(html,/LOW: \+1 · HIGH: −1/);assert.doesNotMatch(html,/Below power|Above power/)})
test('Worlds and Grand Tours render their respective tracker terminology',()=>{assert.match(renderToStaticMarkup(createElement(LiveTrackerLabel,{worlds:true})),/LIVE RACE TRACKER/);assert.match(renderToStaticMarkup(createElement(LiveTrackerLabel,{worlds:false})),/LIVE STAGE TRACKER/)})
