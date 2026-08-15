import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { getAuthoritativeProfile, normalizeProfileForViewport, repeatProfileForLaps, sampleProfileForSvg } from './courseProfile.ts'
import { tour2026, toRaceStage, vuelta2026 } from './professionalRaces.ts'
import { uciWorlds2026 } from './uciWorlds2026.ts'
import { createRoadModel, markerLabelOffset } from '../engine/roadModel.ts'
import { raceIdentities } from './raceLibrary.ts'

const fallbackSegments=[{name:'Generic mountain workout',type:'Repeated climbs',zone:'Z4',power:'Hard',cadence:'80',resistance:'50%',routeKm:0,icon:'',sec:1800,description:'',objective:'',secondaryObjective:'',terrainLabel:''}]

test('Tour Stage 9 uses one shape-preserving authoritative profile in detail and cockpit',()=>{
 const professional=tour2026.stages[8]
 const sourceSnapshot=structuredClone(professional.profilePoints)
 const stage=toRaceStage(tour2026,professional)
 const detail=createRoadModel(9,fallbackSegments,stage.distanceKm,raceIdentities['tour-2026'],stage.profilePoints)
 const cockpit=createRoadModel(9,stage.segments,stage.distanceKm,raceIdentities['tour-2026'],stage.profilePoints)
 assert.deepEqual(detail.points,cockpit.points)
 assert.deepEqual(detail.profilePoints,cockpit.profilePoints)
 assert.equal(detail.profileSourceKind,'authoritative')
 assert.deepEqual(professional.profilePoints,sourceSnapshot,'rendering must not mutate production data')
 assert.ok(detail.points.length>60,'rolling terrain is smoothly sampled rather than a sparse sawtooth')
 const extrema=professional.profilePoints.filter((point,index,all)=>index>0&&index<all.length-1&&(point.elevationM-all[index-1].elevationM)*(all[index+1].elevationM-point.elevationM)<0)
 assert.ok(extrema.length>=8,'distinct official rises and valleys remain present')
})

test('verified Tour and Vuelta stages bypass generic profile generation',()=>{
 for(const race of [tour2026,vuelta2026]) for(const professional of race.stages){
  const stage=toRaceStage(race,professional)
  const model=createRoadModel(stage.number,fallbackSegments,stage.distanceKm,undefined,stage.profilePoints)
  assert.equal(model.profileSourceKind,'authoritative')
  assert.equal(model.points.length,getAuthoritativeProfile(professional).length)
 }
})

test('viewport and SVG transformations are immutable and retain every course sample',()=>{
 const source=getAuthoritativeProfile(tour2026.stages[8]); const snapshot=structuredClone(source)
 assert.equal(normalizeProfileForViewport(source,154.6).length,source.length)
 assert.deepEqual(sampleProfileForSvg(source),source)
 assert.deepEqual(source,snapshot)
})

test('marker geometry remains upward-only and finish label is edge-safe',()=>{
 const stage=toRaceStage(tour2026,tour2026.stages[8]); const model=createRoadModel(9,stage.segments,stage.distanceKm,undefined,stage.profilePoints)
 assert.ok(model.markers.every(marker=>marker.topY<marker.localY))
 assert.equal(model.markers.at(-1)?.label,'FINISH')
 assert.ok(markerLabelOffset(1).translateX < -100)
 assert.ok(model.actionTargets(10).current,'action targets remain part of the authoritative road model')
})

test('UCI Worlds registers distinct TT and reusable circuit courses without fabricated facts',()=>{
 assert.equal(uciWorlds2026.races.length,2)
 const tt=uciWorlds2026.races.find(race=>race.discipline==='individual-time-trial')!
 const road=uciWorlds2026.races.find(race=>race.discipline==='road-race')!
 assert.equal(tt.course.distanceKm,39.2); assert.equal(tt.course.verification.profile,false); assert.equal(tt.course.verification.map,true)
 assert.equal(tt.course.verification.markers,false); assert.equal(tt.course.verification.ascent,false); assert.equal(tt.course.workoutReady,false); assert.equal(tt.course.profile,undefined)
 assert.equal(road.course.courseKind,'circuit'); assert.equal(road.course.lapDistanceKm,13.4); assert.equal(road.course.lapCount,undefined); assert.equal(road.course.totalDistanceKm,undefined)
 const repeated=repeatProfileForLaps(road.course.lapProfile!,road.course.lapDistanceKm!,2)
 assert.equal(repeated.at(-1)?.distanceKm,26.8)
 assert.equal(repeated.length,road.course.lapProfile!.length*2-1)
})

test('race hub markup retains stable mobile semantics',()=>{
 const overview=readFileSync(new URL('../screens/RaceOverviewScreen.tsx',import.meta.url),'utf8')
 const detail=readFileSync(new URL('../screens/StageDetailScreen.tsx',import.meta.url),'utf8')
 const css=readFileSync(new URL('../App.css',import.meta.url),'utf8')
 assert.match(overview,/stage-status.*<strong>/s); assert.match(overview,/rest-day-row/)
 assert.match(detail,/race-hero-title/); assert.match(css,/@media\(max-width:430px\)/)
})
