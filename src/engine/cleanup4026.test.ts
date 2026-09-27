import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildPostRideReport } from './postRideReport4026.ts'
import type { CalendarAssignment } from './alpha4025.ts'

const assignment:CalendarAssignment={
 id:'w1-d3',workoutId:'tempo-climb-45',date:'2026-09-23',day:'Wednesday',type:'CYCLING',
 title:'Controlled Climbing Tempo',purpose:'Build sustained climbing control.',camp:'Climbing',
 durationMinutes:45,intensity:'MODERATE',demandingCycling:false,environment:'INDOOR',
 primary:'Controlled tempo.',shortened:'Short ride.',indoorAlternative:'Primary.',outdoorAlternative:'Tempo climb.',
 recoveryAlternative:'Rest.',powerTarget:{minimum:174,maximum:197},effort:'Comfortable',
 fueling:{classification:'Quality interval',carbohydrateDemand:'Moderate',preRide:'Fuel normally.',carbsPerHour:30,fluidMlPerHour:500,electrolytes:'Use as conditions require.',recoveryPriority:'Recover.',nextDayWorkload:'Easy'},
 status:'COMPLETED'
}

test('post ride report evaluates duration and power against the assignment',()=>{
 const report=buildPostRideReport(assignment,{id:'ride',date:'2026-09-23T12:00:00Z',source:'Manual',durationMinutes:45,distanceKm:20,averagePower:185,averageCadence:81,averageHeartRate:139,rpe:5},229)
 assert.equal(report.outcome,'ON TARGET')
 assert(report.evidence.some(item=>item.includes('185 W')))
 assert.match(report.nextStep,/next scheduled session/i)
})

test('short ride is preserved as evidence instead of being called on target',()=>{
 const report=buildPostRideReport(assignment,{id:'ride',date:'2026-09-23T12:00:00Z',source:'Manual',durationMinutes:20,distanceKm:10},229)
 assert.equal(report.outcome,'NEEDS REVIEW')
})

test('settings dark theme has explicit readable foregrounds',()=>{
 const css=readFileSync(new URL('../App.css',import.meta.url),'utf8')
 assert.match(css,/4\.0\.26 cleanup: settings contrast/)
 assert.match(css,/\.settings-screen h1/)
 assert.match(css,/color:#f4f4f6!important/)
})

test('health screen exposes recent strain input',()=>{
 const source=readFileSync(new URL('../screens/HealthScreen.tsx',import.meta.url),'utf8')
 assert.match(source,/Recent strain/)
 assert.match(source,/entry\.recentStrain/)
})
