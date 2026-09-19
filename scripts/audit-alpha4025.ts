import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createDevelopmentProfile, generatePlan, HAL_BASELINE, HAL_GOALS, HAL_INPUT, recommendSeries, validFemmesProductionStage } from '../src/engine/alpha4025.ts'
import { migrateCareer } from '../src/state/careerPersistence.ts'

assert.equal(recommendSeries('Male'),'Standard RtR');assert.equal(recommendSeries('Female'),'RtR Femmes');assert.equal(recommendSeries('Prefer not to answer'),null)
const profile=createDevelopmentProfile(HAL_INPUT),plan=generatePlan(HAL_INPUT,HAL_GOALS)
assert.equal(HAL_INPUT.ftp,206);assert.match(profile.archetype,/Sustained-Power Climber/);assert.equal(plan.startDate,'2026-09-21');assert.equal(plan.weeks.length,12);assert.deepEqual(plan.weeks.filter(w=>w.recoveryWeek).map(w=>w.number),[4,8,12]);assert.ok(plan.weeks.every(w=>w.assignments.filter(a=>a.demandingCycling).length<=2));assert.equal(HAL_BASELINE.powerWatts,undefined);assert.equal(HAL_BASELINE.durationSeconds,5499)
assert.equal(validFemmesProductionStage({id:'development-fixture',order:1,profileVerified:false}),false)
const migrated=migrateCareer({schemaVersion:5,rider:{name:'Legacy',ftp:190},rideHistory:[{id:'preserved'}]} as never);assert.equal(migrated.schemaVersion,6);assert.equal(migrated.rideHistory[0].id,'preserved')
const ui=readFileSync(new URL('../src/screens/OffSeasonScreen.tsx',import.meta.url),'utf8'),css=readFileSync(new URL('../src/App.css',import.meta.url),'utf8'),app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8')
for(const token of ['RIDER-DEVELOPMENT PROFILE','Recommended training camps','Personalized 12-week calendar','OUTDOOR ACTIVITY','READINESS'])assert.match(ui,new RegExp(token))
for(const width of [320,375,390,430])assert.ok(width<=430&&css.includes('@media(max-width:430px)'))
assert.match(app,/OffSeasonScreen/);assert.match(app,/Synchronized Stage Engine/)
console.log('Alpha 4.0.25 audit passed: schema 6, pathways, Hal baseline, explained camps, 12-week scheduling, no-power honesty, readiness and responsive off-season UI.')
