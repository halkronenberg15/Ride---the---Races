import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ChaseDecisionCard, ProfileDetail4022, ProfileViewControl, WorldsGroupMarkers } from '../components/WorldsRaceLayer.ts'
import { montrealRoadStory, synchronizeProfileView } from './alpha4022.ts'

test('rendered race-position layer exposes independent breakaway, Chase and peloton markers',()=>{const html=renderToStaticMarkup(createElement(WorldsGroupMarkers,{event:montrealRoadStory[2],courseProgress:.3}));assert.match(html,/BREAKAWAY/);assert.match(html,/CHASE GROUP/);assert.match(html,/PELOTON/);assert.match(html,/Authored race-position groups/)})
test('rendered Chase preview exposes contextual call, resolver preview and both decisions',()=>{const html=renderToStaticMarkup(createElement(ChaseDecisionCard,{event:montrealRoadStory[2],active:false,onAccept:()=>{},onHold:()=>{}}));assert.match(html,/CHASE OPPORTUNITY/);assert.match(html,/dangerous/);assert.match(html,/ACTIVE PELOTON PROFILE/);assert.match(html,/HOLD POSITION/)})
test('rendered accepted Chase visibly identifies changed tactical targets',()=>{const html=renderToStaticMarkup(createElement(ChaseDecisionCard,{event:montrealRoadStory[2],active:true,onAccept:()=>{},onHold:()=>{}}));assert.match(html,/CHASE ACTIVE/);assert.match(html,/TACTICAL EFFORT · targets changed/)})
test('rendered Detail includes accessible toggle and synchronized gradient presentation',()=>{const state=synchronizeProfileView({mode:'OVERVIEW',activeRangeId:null,autoConsumedIds:[]},montrealRoadStory[2]);const control=renderToStaticMarkup(createElement(ProfileViewControl,{state,onToggle:()=>{}})),detail=renderToStaticMarkup(createElement(ProfileDetail4022,{state,event:montrealRoadStory[2],progress:.25,gradientBlocks:[{start:0,end:.5,gradient:3.4},{start:.5,end:1,gradient:1.9}],gradientIndex:0,currentGradient:3.4,nextGradient:1.9,distanceToTransition:.8,resistance:'44–46%'}));assert.match(control,/Switch profile to Overview view/);assert.match(detail,/RIDER COORDINATE 25.0%/);assert.match(detail,/0.80 km/);assert.match(detail,/44–46%/)})
