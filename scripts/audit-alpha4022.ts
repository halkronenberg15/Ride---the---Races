import assert from 'node:assert/strict'
import { seasons } from '../src/data/seasonCalendar.ts'
import { uciWorlds2026, WORLDS_DURATIONS, worldsStage } from '../src/data/uciWorlds2026.ts'
import { activeRaceSituation, circuitProgressToLap, gradientDetail, montrealRoadStory, resistanceDirection, returnMultiplier, stage7GradientRegression, synchronizeProfileView, toggleProfileView } from '../src/engine/alpha4022.ts'
import { migrateCareer } from '../src/state/careerPersistence.ts'

const events=seasons[0].races.filter(event=>event.id.startsWith('worlds-2026-'))
assert.equal(events.length,2);assert.deepEqual(events.map(e=>e.startDate),['2026-09-20','2026-09-27'])
assert.equal(uciWorlds2026.races[0].course.distanceKm,39.2);assert.equal(uciWorlds2026.races[1].course.totalDistanceKm,273.7);assert.equal(uciWorlds2026.races[1].course.lapCount,12)
for(const [kind,values] of [['itt',WORLDS_DURATIONS.itt],['road',WORLDS_DURATIONS.road]] as const)for(const minutes of values){const stage=worldsStage(kind,minutes);assert.equal(stage.segments.reduce((n,s)=>n+s.sec,0),minutes*60);assert(stage.segments.every((s,i,a)=>!i||s.routeKm>=a[i-1].routeKm))}
const itt=worldsStage('itt');assert(itt.officialCourseMarkers?.every(marker=>marker.type==='tt-check'));assert(!itt.segments.some(segment=>/sprint|attack|chase/i.test(segment.type)))
assert.equal(montrealRoadStory.length,8);assert.equal(activeRaceSituation('tour-2026',.3),undefined);assert(montrealRoadStory.every((e,i,a)=>e.id&&e.trigger<e.expiry&&(!i||e.trigger>=a[i-1].trigger)&&e.caption&&e.groupState&&e.actions.length&&e.preview&&e.accepted&&e.decline&&e.resolutionCaption))
assert.equal(circuitProgressToLap(.41),1);assert.equal(circuitProgressToLap(.97),12);assert.equal(returnMultiplier(45),1)
const initial={mode:'OVERVIEW' as const,activeRangeId:null,autoConsumedIds:[]};const chase=montrealRoadStory[2],zoom=synchronizeProfileView(initial,chase);assert.equal(zoom.mode,'DETAIL');assert.equal(toggleProfileView(zoom).mode,'OVERVIEW');assert.equal(synchronizeProfileView(zoom,undefined,true).mode,'OVERVIEW')
const detail=gradientDetail([{id:'a',start:0,end:.5,gradient:3.4},{id:'b',start:.5,end:1,gradient:1.9}],.6);assert.equal(detail.current.gradient,1.9);assert.equal(detail.next,null)
assert.equal(resistanceDirection(stage7GradientRegression.from,stage7GradientRegression.to).valid,true);assert.equal(resistanceDirection(stage7GradientRegression.from,{...stage7GradientRegression.to,resistance:48}).valid,false);assert.equal(resistanceDirection(stage7GradientRegression.from,{...stage7GradientRegression.to,resistance:48},'POWER TARGET').valid,true)
const legacy=migrateCareer({rider:{team:'Équipe Loriot'} as never});assert.equal(legacy.rider.team,'Équipe Loriot');assert.deepEqual(legacy.alpha4022.worldsResults,{})
console.log('Alpha 4.0.22 audit passed: Worlds events, canonical durations/laps, Montréal-only story, zoom, gradient consistency, and additive migration.')
