import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProfileDetail4022, ProfileViewControl, situationGroups } from '../components/WorldsRaceLayer.ts'
import { montrealRoadStory, synchronizeProfileView, toggleProfileView } from './alpha4022.ts'

const overview={mode:'OVERVIEW' as const,activeRangeId:null,autoConsumedIds:[]},detail=synchronizeProfileView(overview,montrealRoadStory[2])
test('qualifying event auto-opens once and expiry returns Overview',()=>{assert.equal(detail.mode,'DETAIL');assert.equal(synchronizeProfileView(detail,montrealRoadStory[2]).autoConsumedIds.length,1);assert.equal(synchronizeProfileView(detail,undefined).mode,'OVERVIEW')})
test('manual switching changes presentation state only',()=>{const toggled=toggleProfileView(detail);assert.equal(toggled.mode,'OVERVIEW');assert.equal(toggled.activeRangeId,detail.activeRangeId);assert.deepEqual(toggled.autoConsumedIds,detail.autoConsumedIds)})
test('Detail component renders compact current, next, boundary, position and resistance data',()=>{const html=renderToStaticMarkup(createElement(ProfileDetail4022,{state:detail,event:montrealRoadStory[2],gradientBlocks:[{start:0,end:.5,gradient:3.4},{start:.5,end:1,gradient:1.9}],gradientIndex:0,currentGradient:3.4,nextGradient:1.9,changeDistance:'0.26 mi',resistance:'44–46%',context:'South Shore Positioning'}));assert.match(html,/CURRENT/);assert.match(html,/NEXT/);assert.match(html,/POSITION/);assert.match(html,/South Shore Positioning/);assert.doesNotMatch(html,/POSITION IN VIEW/);assert.match(html,/0.26 mi/);assert.match(html,/44–46%/);assert.doesNotMatch(html,/0–50%|detail-gradient-blocks/)})
test('Overview suppresses detail while the accessible view control remains operable',()=>{assert.equal(renderToStaticMarkup(createElement(ProfileDetail4022,{state:overview,gradientBlocks:[],gradientIndex:0,currentGradient:0,nextGradient:null,changeDistance:null,resistance:'0%'})),'');assert.match(renderToStaticMarkup(createElement(ProfileViewControl,{state:detail,onToggle:()=>{}})),/Switch profile to Overview view/)})
test('authored race markers move independently around one canonical rider coordinate',()=>{const a=situationGroups(montrealRoadStory[2],.3,'CHASING'),b=situationGroups(montrealRoadStory[2],.4,'CHASING');assert(a.every((_,index)=>b[index].position>a[index].position));assert.notEqual(a.find(g=>g.id==='peloton')?.position,.3)})
