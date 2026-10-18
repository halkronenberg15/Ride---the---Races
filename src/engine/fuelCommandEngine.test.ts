import test from 'node:test'
import assert from 'node:assert/strict'
import { rideFuelPrescription } from './fuelCommandEngine.ts'
import type { CalendarAssignment } from './alpha4025.ts'

const ride=(durationMinutes:number,intensity:'EASY'|'MODERATE'|'HARD'='EASY',demandingCycling=false):CalendarAssignment=>({
 id:'ride',date:'2026-10-18',day:'Sunday',type:'CYCLING',title:'Ride',purpose:'Test',camp:'Base',durationMinutes,intensity,demandingCycling,environment:'INDOOR',primary:'',shortened:'',indoorAlternative:'',outdoorAlternative:'',recoveryAlternative:'',effort:intensity==='HARD'?'Hard but controlled':'Easy',fueling:{classification:'Easy Zone 2',carbohydrateDemand:'Low',preRide:'',carbsPerHour:null,fluidMlPerHour:null,electrolytes:'',recoveryPriority:'',nextDayWorkload:''},status:'PLANNED'
})

test('ride fuel command scales a long ride',()=>{
 const result=rideFuelPrescription({assignments:[ride(120,'MODERATE')],dayClass:'HIGH'})
 assert.deepEqual(result.carbsPerHour,[50,70])
 assert.deepEqual(result.rideCarbsTotal,[100,140])
 assert.deepEqual(result.fluidOzPerHour,[16,24])
 assert.ok(result.windows.some(item=>item.label==='During ride'))
})

test('ride fuel command keeps recovery day simple',()=>{
 const result=rideFuelPrescription({assignments:[],dayClass:'RECOVERY'})
 assert.equal(result.rideMinutes,0)
 assert.deepEqual(result.carbsPerHour,[0,25])
 assert.equal(result.windows[0].label,'No ride fuel required')
})
