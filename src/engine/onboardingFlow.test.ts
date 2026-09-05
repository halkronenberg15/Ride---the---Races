import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { advanceOnboarding, canAdvanceOnboarding } from './onboardingFlow.ts'
import { createInitialCareer, equipmentForDevices, migrateCareer } from '../state/careerPersistence.ts'

test('brand-new rider completes onboarding by Continue activation and persists schema v3',()=>{
 const fresh=createInitialCareer();assert.equal(fresh.onboardingComplete,false);assert.equal(fresh.rider.name,'');assert.equal(fresh.rider.ftpKnown,false)
 const rider={...fresh.rider,name:'hal',nationality:'USA',number:15,heightCm:177.8,weightKg:115.7}
 const numbers={numberText:'15',heightText:'70',weightText:'255',ftpText:''}
 assert.equal(canAdvanceOnboarding(0,rider,numbers),true)
 let step=advanceOnboarding(0,rider,numbers);assert.equal(step,1,'clicking Continue advances to Step 2')
 assert.equal(canAdvanceOnboarding(step,rider,numbers),true,'unknown FTP is explicitly unverified, not silently confirmed')
 while(step<5)step=advanceOnboarding(step,rider,numbers)
 const completed={...fresh,onboardingComplete:true,rider:{...rider,devices:['Peloton'] as const},equipment:equipmentForDevices(['Peloton'])}
 const persisted=JSON.parse(JSON.stringify(completed));const restored=migrateCareer(persisted)
 assert.equal(restored.schemaVersion,3);assert.equal(restored.onboardingComplete,true);assert.equal(restored.rider.name,'hal');assert.equal(restored.rider.ftp,0);assert.equal(restored.rider.ftpKnown,false);assert.equal(restored.equipment.activeEquipmentId,'peloton-baseline-bike')
 const screen=readFileSync(new URL('../screens/OnboardingScreen.tsx',import.meta.url),'utf8');assert.match(screen,/<form[^>]+onSubmit=/);assert.match(screen,/type="submit"/);assert.doesNotMatch(screen,/type="button" className="primary-button"[^>]*>Continue/)
 assert.match(screen,/Choose your equipment/);assert.match(screen,/Connection method/);assert.match(screen,/Live bike telemetry: Not connected/);assert.match(screen,/Connected smart equipment:<\/strong> Coming later/)
})

test('Step 1 remains blocked for missing visible identity/body fields and known FTP is required on Step 2',()=>{const fresh=createInitialCareer(),numbers={numberText:'15',heightText:'70',weightText:'255',ftpText:''};assert.equal(canAdvanceOnboarding(0,{...fresh.rider,name:'h',nationality:'USA'},numbers),false);assert.equal(canAdvanceOnboarding(0,{...fresh.rider,name:'hal',nationality:'USA'},numbers),true);assert.equal(canAdvanceOnboarding(1,{...fresh.rider,ftpKnown:true},numbers),false);assert.equal(canAdvanceOnboarding(1,{...fresh.rider,ftpKnown:true},{...numbers,ftpText:'208'}),true)})
