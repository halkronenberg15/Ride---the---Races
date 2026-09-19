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
assert.match(ride,/\{stage\.isTraining\?'SESSION':'STAGE'\}: \{formatTime\(officialTime\.total\)\} TOTAL/)
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
const releaseCloseout=readFileSync(new URL('../src/engine/release4024.ts',import.meta.url),'utf8')
const trainingLibrary=readFileSync(new URL('../src/screens/RaceLibraryScreen.tsx',import.meta.url),'utf8')
const styles=readFileSync(new URL('../src/App.css',import.meta.url),'utf8')
for(const token of ['noFtpPresentation',"heading:'EFFORT'",'rideOpeningMessage'])assert.match(releaseCloseout,new RegExp(token))
assert.match(ride,/displayEffort\?'EFFORT':'POWER'/)
assert.match(ride,/upNext\.effort\?\?upNext\.power/)
assert.match(trainingLibrary,/activeTrainingFolder===null/)
assert.match(trainingLibrary,/Back to Training Library/)
assert.match(trainingLibrary,/library!=='training'&&showRoster/)
assert.match(styles,/safe-area-inset-bottom[^\n]+112px/)
const mergeCandidate=readFileSync(new URL('../src/engine/release4024.ts',import.meta.url),'utf8')
const hq=readFileSync(new URL('../src/screens/TeamHQScreen.tsx',import.meta.url),'utf8')
for(const token of ['effortLanguage','VERY EASY','coordinatedDistance','completeSessionTime'])assert.match(mergeCandidate,new RegExp(token))
assert.match(ride,/stage\.isTraining\?'SESSION':'STAGE'/)
assert.match(ride,/stage\.isTraining\?'Restart Ride':'Restart Stage'/)
assert.equal((ride.match(/▲ Hide Ride Details/g)??[]).length,1)
assert.match(hq,/FTP NOT SET/);assert.match(hq,/RPE-BASED TARGETS/);assert.match(hq,/Intro to Cycling/)
assert.match(trainingLibrary,/rtr-training-folder/)
assert.match(styles,/safe-area-inset-top/);assert.match(styles,/safe-area-inset-bottom/)

// Alpha 4.0.24.1 phone patch: centered countdown, distinct beginner steps,
// and one balanced whole-second session projection. Safari preview spacing is unchanged.
assert.match(ride,/\.compact-section-clock\{[^}]*justify-content:center[^}]*text-align:center/)
for(const token of ['beginnerSectionIntent','Light Load Step','28–33%','completeSessionTime'])assert.match(mergeCandidate,new RegExp(token,'i'))
assert.match(mergeCandidate,/Math\.floor\(elapsedSeconds\)/)

// Alpha 4.0.24.1 contrast follow-up.
for(const token of ['--auth-panel-foreground: #f7f7f8','--auth-link: #ffad73','-webkit-text-fill-color:var(--auth-input-foreground)','--folder-description: #4a4a52','--folder-disabled-foreground: #74747c'])assert.match(styles,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))
assert.match(trainingLibrary,/training-folder-description/)
assert.match(styles,/\.training-folder-row\.is-enabled \.training-folder-description\{color:var\(--folder-description\);opacity:1\}/)

// Alpha 4.0.24.1 Jean context isolation.
for(const token of ['jeanTimelineEventAllowed','restoredJeanMessageAllowed','explicitlyAuthoredTerrain'])assert.match(mergeCandidate,new RegExp(token))
assert.match(ride,/ineligible\.map\(event=>`\$\{library\}-stage\$\{stage\.number\}-\$\{event\.key\}`\)/)
assert.match(ride,/coachingContext:jeanContext,activityKey:jeanActivityKey/)
