import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bikeProfileForEquipment, PELOTON_BASELINE_EQUIPMENT, PELOTON_MANUAL_PROFILE, resolveManualBikeTarget } from '../src/engine/manualBike.ts'
import { getRaceStage } from '../src/data/raceStages.ts'
import { buildSprintPhases } from '../src/engine/sprintPhases.ts'
import { equipmentForDevices } from '../src/state/careerPersistence.ts'
import { shouldDisplayClimb, tacticalOpportunity, trainingMarkerPositions } from '../src/engine/alpha4021.ts'
const ride=readFileSync(new URL('../src/screens/RideScreen.tsx',import.meta.url),'utf8'),brief=readFileSync(new URL('../src/screens/TacticsScreen.tsx',import.meta.url),'utf8')
assert.doesNotMatch(brief,/strategy-selector/);assert.match(brief,/SESSION GOALS/);assert.match(ride,/RECOVERY SESSION/);assert.match(ride,/tactical-event-card/)
const stage=getRaceStage(8);const sprint={...stage.segments[0],name:'Final Lead-out',type:'Sprint sector'};assert.ok(['BUILD','POSITION','LAUNCH','SPRINT'].every(name=>buildSprintPhases(sprint).some(p=>p.name===name)))
assert.ok(tacticalOpportunity({name:'Late Climb',type:'Sustained climb',sec:300},false,false,60));assert.equal(tacticalOpportunity(stage.segments[1],true,false,60),null)
const low=resolveManualBikeTarget({powerRange:{min:105,max:120},cadenceRange:{min:92,max:100},gradient:0,equipment:PELOTON_BASELINE_EQUIPMENT,profile:PELOTON_MANUAL_PROFILE});assert.ok(low.feasibleCombinations.length);assert.ok(low.resolvedResistanceRange!.max-low.resolvedResistanceRange!.min<=3)
const runtimeBike=equipmentForDevices(['Peloton']).instances[0];assert.equal(bikeProfileForEquipment(runtimeBike)?.calibrationConfidence,'PERSONALIZED');assert.equal(runtimeBike.calibrationSamples?.[0].equipmentId,runtimeBike.id);
const recovery=resolveManualBikeTarget({powerRange:{min:95,max:115},cadenceRange:{min:85,max:90},gradient:0,equipment:PELOTON_BASELINE_EQUIPMENT,profile:PELOTON_MANUAL_PROFILE});assert.deepEqual([recovery.recommendedCadence,recovery.recommendedResistance],[88,36]);
assert.deepEqual(trainingMarkerPositions([{sec:300},{sec:600},{sec:600},{sec:300}]).map(x=>Math.round(x*1000)/10),[0,16.7,50,83.3,100]);assert.equal(shouldDisplayClimb({authoredClassified:false,averageGradient:.6,elevationGainM:8,distanceKm:1.3}),false)
console.log('Alpha 4.0.21 audit passed: Stage 8 start, Coastal Peloton, late climb, tactical opportunity, sprint BUILD/POSITION/LAUNCH/SPRINT, cooldown; Recovery Spin 30 separation, normalized sectors, feasible low-power target, recovery ceiling.')
