import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PreviewTargetValues } from '../components/PreviewTargetValues.ts'
import { trainingRides } from '../data/raceLibrary.ts'
import { adaptSegment } from './adaptiveRide.ts'
import { bikeProfileForEquipment, type EquipmentInstance } from './manualBike.ts'
import { resolvePreviewTarget } from './previewTargets.ts'
import { equipmentForDevices, migrateCareer } from '../state/careerPersistence.ts'
import { pauseClock, resumeClock } from './activeRideClock.ts'
import { readFileSync } from 'node:fs'

const source=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8')
for(const ftp of [150,206])test(`new-rider Peloton renders Recovery Spin resistance at ${ftp} W FTP`,()=>{
 // Same value emitted by the onboarding Peloton control.
 const onboarding=source('../screens/OnboardingScreen.tsx');assert.match(onboarding,/device:'Peloton'/)
 const saved=equipmentForDevices(['Peloton']);const equipment=saved.instances.find(item=>item.id===saved.activeEquipmentId) as EquipmentInstance
 assert.equal(equipment.id,'peloton-baseline-bike');assert.equal(equipment.calibrationProfileId,'peloton-bike-manual-reference')
 const profile=bikeProfileForEquipment(equipment);assert.ok(profile);assert.equal(profile!.id,equipment.calibrationProfileId)
 const recovery=trainingRides.find(ride=>ride.id==='recovery-30')!.stage
 const segment=adaptSegment(recovery.segments[1],ftp,'Balanced')
 const target=resolvePreviewTarget(segment,ftp,equipment)
 const markup=renderToStaticMarkup(createElement(PreviewTargetValues,{target}))
 assert.doesNotMatch(markup,/UNAVAILABLE/);assert.match(markup,/RESISTANCE/);assert.match(markup,/Start|START/)
 assert.ok(target.manualTarget.resolvedResistanceRange);assert.ok(target.manualTarget.resolvedResistanceRange!.max-target.manualTarget.resolvedResistanceRange!.min<=3)
 // Pause/resume and reload do not rewrite the separately persisted calibrated equipment identity.
 const clock={accumulatedSeconds:12,runningSince:1000,paused:false};const resumed=resumeClock(pauseClock(clock,4000),5000)
 assert.equal(resumed.runningSince,5000)
 const restored=migrateCareer(JSON.parse(JSON.stringify({onboardingComplete:true,rider:{devices:['Peloton'],ftp},equipment:saved})))
 const restoredBike=restored.equipment.instances.find(item=>item.id===restored.equipment.activeEquipmentId) as EquipmentInstance
 assert.equal(bikeProfileForEquipment(restoredBike)?.calibrationConfidence,'PERSONALIZED')
})

test('Recovery Spin rendered controls use training language and canonical equipment path',()=>{const briefing=source('../screens/TacticsScreen.tsx'),cockpit=source('../screens/RideScreen.tsx');assert.match(briefing,/stage\.isTraining \? 'START RIDE'/);assert.match(cockpit,/stage\.isTraining \? '🚩 Start Ride' : '🚩 Roll Out'/);assert.match(cockpit,/createRoadModel\([^\n]+equipment/);assert.match(cockpit,/bikeProfileForEquipment\(equipment\)/)})
