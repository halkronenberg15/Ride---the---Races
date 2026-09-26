import test from 'node:test'
import assert from 'node:assert/strict'
import { strengthSessionForAssignment } from './strengthTraining4026.ts'
import type { CalendarAssignment } from './alpha4025.ts'
import { readFileSync } from 'node:fs'

const base:CalendarAssignment={id:'w1-d2-strength-a',date:'2026-09-22',day:'Tuesday',type:'STRENGTH',title:'Strength A',purpose:'Unilateral strength, posterior chain and core stability.',camp:'Aerobic Base Camp',durationMinutes:30,intensity:'MODERATE',demandingCycling:false,environment:'INDOOR',primary:'30 minutes',shortened:'One controlled round.',indoorAlternative:'Primary strength session.',outdoorAlternative:'Not applicable.',recoveryAlternative:'Mobility only.',effort:'Comfortable',fueling:{classification:'Strength',carbohydrateDemand:'Moderate',preRide:'Normal meal timing; arrive hydrated.',carbsPerHour:null,fluidMlPerHour:null,electrolytes:'Optional; adjust for heat and sweat.',recoveryPriority:'Support the next scheduled workload.',nextDayWorkload:'Follow the calendar'},status:'PLANNED'}

test('Strength A provides a complete guided prescription',()=>{const session=strengthSessionForAssignment(base);assert.equal(session.title,'Strength A');assert.equal(session.durationMinutes,30);assert(session.exercises.length>=6);assert(session.exercises.every(item=>item.sets>0&&item.repetitions>0&&item.restSeconds>0&&item.substitution))})
test('Strength B uses the lighter durability library',()=>{const session=strengthSessionForAssignment({...base,id:'w1-d5-strength-b',title:'Strength B'});assert.equal(session.title,'Strength B');assert(session.exercises.some(item=>/step-up/i.test(item.name)));assert(session.exercises.some(item=>/side plank/i.test(item.name)))})
test('Jean final-ten section cue is suppressed in 4.0.26',()=>{const ride=readFileSync(new URL('../screens/RideScreen.tsx',import.meta.url),'utf8');assert.match(ride,/engine\.events\.find\(\(item\) => item === 'final-30'\)/);assert.doesNotMatch(ride,/item === 'final-30' \|\| item === 'final-10'/)})
