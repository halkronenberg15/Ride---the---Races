import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CLIMB_ENTRY_PROGRESS, CLIMB_EXIT_PROGRESS, CLIMB_MINIMUM_VISIBLE_SECONDS, JEAN_PRESENTATION_MS, qualifiesForClimbView } from '../src/engine/alpha4024.ts'

assert.equal(JEAN_PRESENTATION_MS,7000)
assert.equal(CLIMB_ENTRY_PROGRESS,.01);assert.equal(CLIMB_EXIT_PROGRESS,.995);assert.equal(CLIMB_MINIMUM_VISIBLE_SECONDS,8)
assert.equal(qualifiesForClimbView({lengthKm:.5,gainM:45}),false)
assert.equal(qualifiesForClimbView({lengthKm:2,gainM:60}),true)
const ride=readFileSync(new URL('../src/screens/RideScreen.tsx',import.meta.url),'utf8')
const layer=readFileSync(new URL('../src/components/WorldsRaceLayer.ts',import.meta.url),'utf8')
const auth=readFileSync(new URL('../src/services/accountStore.ts',import.meta.url),'utf8')
assert.match(ride,/STAGE: \{formatTime\(officialTime\.total\)\} TOTAL/)
assert.match(layer,/FIRST RACING SECTION/)
assert.equal((ride.match(/className="target-grid"/g)??[]).length,1)
assert.match(auth,/PBKDF2/);assert.match(auth,/Owner access is required/);assert.doesNotMatch(auth,/Michelle/i)
assert.match(auth,/MULTI_DEVICE_ENROLLMENT_AVAILABLE=false/)
const library=readFileSync(new URL('../src/data/raceLibrary.ts',import.meta.url),'utf8');for(const title of ['Bike and Rhythm Foundations','Cadence and Resistance Control','Preparing for Longer and Outdoor Rides'])assert.match(library,new RegExp(title))
console.log('Alpha 4.0.24 audit passed: hierarchy, stage time, Jean lifecycle, and climb gate are connected.')

for(const token of ['prescriptionSnapshot','noFtpTarget','coachingContext','closeSeason','wakeLockMessage'])assert.match(readFileSync(new URL('../src/engine/release4024.ts',import.meta.url),'utf8'),new RegExp(token))
assert.match(ride,/upNext\.resistance/)
assert.match(library,/Intro Calibration Ride/)

for(const token of ['OriginalTargetSnapshot','originalTargetsAvailable','applyRideCorrection','completedSteps','alpha4024.2'])assert.match(readFileSync(new URL('../src/engine/release4024.ts',import.meta.url),'utf8'),new RegExp(token))
assert.match(readFileSync(new URL('../src/screens/TeamBusScreen.tsx',import.meta.url),'utf8'),/Original Targets unavailable/)
assert.match(readFileSync(new URL('../src/screens/RideDataScreen.tsx',import.meta.url),'utf8'),/Compare original submitted entry/)
