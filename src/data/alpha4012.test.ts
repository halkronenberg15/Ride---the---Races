import assert from 'node:assert/strict'
import test from 'node:test'
import { tour2026, vuelta2026 } from './professionalRaces.ts'
import { auditProfessionalRace, validateProfessionalRace } from './professionalWorkoutValidation.ts'
import { createStageTimeline } from '../engine/stageEngine.ts'

test('Alpha 4.0.12 makes exactly 42 verified Grand Tour stages production ready',()=>{
 assert.equal(tour2026.stages.length,21);assert.equal(vuelta2026.stages.length,21)
 assert.equal(tour2026.restDays.length,2);assert.equal(vuelta2026.restDays.length,2)
 for(const race of [tour2026,vuelta2026]){assert.equal(race.stages.filter(stage=>stage.verification.profile).length,21);assert.equal(race.stages.filter(stage=>stage.workoutReady&&stage.rideable).length,21);assert.deepEqual(validateProfessionalRace(race),[])}
 assert.equal([...tour2026.stages,...vuelta2026.stages].filter(stage=>stage.workoutReady).length,42)
})

test('shared audit reports complete coverage, briefings and targets with diagnostic identities',()=>{
 const audit=[...auditProfessionalRace(tour2026),...auditProfessionalRace(vuelta2026)]
 assert.equal(audit.length,42);for(const row of audit){assert.ok(row.id&&row.route,`${row.race} Stage ${row.stage}: identity`);assert.equal(row.coverageValid,true,`${row.race} Stage ${row.stage}: coverage`);assert.equal(row.briefingPresent,true,`${row.race} Stage ${row.stage}: briefing`);assert.equal(row.targetsPresent,true,`${row.race} Stage ${row.stage}: targets`)}
})

test('canonical mapping is monotonic, continuous and resolves action targets for all stages',()=>{
 for(const race of [tour2026,vuelta2026])for(const stage of race.stages){const timeline=createStageTimeline(stage.segments,stage.officialDistanceKm);let prior=0;for(let time=0;time<=timeline.duration;time+=Math.max(1,timeline.duration/50)){const snapshot=timeline.snapshot(time);assert.ok(snapshot.courseDistance>=prior,`${race.name} Stage ${stage.number}: monotonic distance`);assert.equal(snapshot.riderPosition,snapshot.courseDistance/stage.officialDistanceKm);prior=snapshot.courseDistance;assert.ok(snapshot.segment.power&&snapshot.segment.cadence&&snapshot.segment.resistance)}assert.equal(timeline.snapshot(timeline.duration).courseDistance,stage.officialDistanceKm)}
})

test('signature stages preserve distinct race behavior',()=>{
 const names=(race:typeof tour2026,n:number)=>race.stages[n-1].segments.map(section=>section.name).join(' ')
 assert.match(names(tour2026,1),/Team|Rotation|Coordinated/);assert.match(names(tour2026,16),/ITT|Time Trial/);assert.match(names(tour2026,17),/Early Alpine Climb/);assert.match(names(tour2026,20),/Croix de Fer.*Télégraphe.*Galibier.*Sarenne.*Alpe d’Huez/);assert.ok((tour2026.stages[19].indoorDurationMinutes??0)>(tour2026.stages[10].indoorDurationMinutes??0));assert.match(names(tour2026,21),/Montmartre.*Champs-Élysées/)
 assert.match(names(vuelta2026,1),/Start Ramp.*Clock Starts|Start Ramp/);assert.ok(vuelta2026.stages.slice(9).every(stage=>stage.segments.length>=7));assert.match(names(vuelta2026,19),/Peñas Blancas/);assert.match(names(vuelta2026,20),/Collado del Alguacil/)
})
