import assert from 'node:assert/strict'
import test from 'node:test'
import { tour2026, toRaceStage, vuelta2026 } from './professionalRaces.ts'
import { createRoadModel, COURSE_MARKER_HEIGHT } from '../engine/roadModel.ts'
import { raceIdentities } from './raceLibrary.ts'

const distances=[19.6,168.5,195.9,181.9,158.3,186.2,175.1,180.4,154.6,166.6,161.3,179.1,205.8,155.3,183.9,26.1,174.7,185.2,127.9,170.9,88.7]
const classifications=['Team time trial','Hilly','Mountain','Hilly','Flat','Mountain','Flat','Flat','Hilly','Mountain','Flat','Flat','Hilly','Mountain','Mountain','Individual time trial','Flat','Mountain','Mountain','Mountain','Flat']
const elevations=(stage:number)=>tour2026.stages[stage-1].profilePoints.map(point=>point.elevationM)

test('Alpha 4.0.9 registers the complete official Tour route and rest days',()=>{
 assert.equal(tour2026.stages.length,21);assert.deepEqual(tour2026.restDays.map(day=>[day.afterStage,day.date]),[[9,'2026-07-13'],[15,'2026-07-20']])
 assert.deepEqual(tour2026.stages.map(stage=>stage.officialDistanceKm),distances)
 assert.deepEqual(tour2026.stages.map(stage=>stage.classification),classifications)
 assert.equal(tour2026.stages[0].classification,'Team time trial');assert.equal(tour2026.stages[15].classification,'Individual time trial')
})

test('every Tour stage has unique verified metre geometry and stage provenance',()=>{
 assert.equal(new Set(tour2026.stages.map(stage=>JSON.stringify(stage.profilePoints))).size,21)
 for(const stage of tour2026.stages){assert.ok(stage.profilePoints.length>=10);assert.equal(stage.verification.profile,true);assert.equal(stage.verification.source,'Tour de France official 2026 stage profile');assert.equal(stage.verification.reference,`https://www.letour.fr/en/stage-${stage.number}`);assert.ok(stage.verification.updatedAt)}
})

test('signature Tour terrain survives independently of official classification',()=>{
 assert.equal(tour2026.stages[16].classification,'Flat');assert.ok(Math.max(...elevations(17).slice(0,8))-Math.min(...elevations(17).slice(0,8))>600)
 const stage20=elevations(20);assert.ok(Math.max(...stage20)-Math.min(...stage20)>1900);assert.ok(stage20.filter((value,index,all)=>index>0&&index<all.length-1&&value>all[index-1]+250&&value>all[index+1]+250).length>=3)
 const late=elevations(21).slice(-8);assert.ok(late.filter((value,index,all)=>index>0&&index<all.length-1&&value>all[index-1]&&value>all[index+1]).length>=3)
})

test('Tour identity colors and upward-only shared marker geometry remain stable',()=>{
 const stage=toRaceStage(tour2026,tour2026.stages[4]);const segments=[...stage.segments,{...stage.segments[0],name:'Intermediate Sprint',type:'Sprint',sec:30},{...stage.segments[0],name:'Test climb',type:'Category climb',sec:30}]
 const model=createRoadModel(5,segments,stage.distanceKm,raceIdentities['tour-2026'],stage.profilePoints,[{id:'sprint',type:'sprint',routeKm:40,label:'SPR',verified:true,source:{organization:'Test',reference:'fixture'}},{id:'kom',type:'kom',routeKm:70,label:'KOM',verified:true,source:{organization:'Test',reference:'fixture'}}])
 assert.equal(model.markers.find(marker=>marker.type==='sprint')?.color,'#38a852');assert.equal(model.markers.find(marker=>marker.type==='kom')?.color,'#ef3340');assert.equal(model.markers.find(marker=>marker.type==='finish')?.color,'#ffffff');assert.equal(model.markers.find(marker=>marker.type==='kilometre-zero')?.color,'#ffd400')
 for(const marker of model.markers){assert.equal(marker.localY-marker.topY,COURSE_MARKER_HEIGHT);assert.ok(marker.topY<marker.localY)}
 const tt=createRoadModel(1,stage.segments,stage.distanceKm,raceIdentities['tour-2026'],stage.profilePoints,[{id:'test-check',type:'tt-check',routeKm:5,label:'CHECK',verified:true,source:{organization:'Test',reference:'fixture'}}]);assert.equal(tt.markers.find(marker=>marker.type==='time-check')?.color,'#55dff7')
})

test('Tour and Vuelta share professional-race shape without changing Vuelta data',()=>{
 for(const race of [tour2026,vuelta2026]){assert.equal(race.stages.length,21);assert.equal(race.restDays.length,2);assert.ok(race.stages.every(stage=>stage.profilePoints.length>0))}
 assert.equal(vuelta2026.stages[0].officialDistanceKm,9.4);assert.equal(vuelta2026.stages[20].finish,'Granada')
})
