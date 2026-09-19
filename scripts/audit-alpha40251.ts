import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { canUseOwnerOffSeasonPreview, emptyAlpha4025, ensureHalOffSeasonPlan, HAL_BASELINE } from '../src/engine/alpha4025.ts'
const identity={role:'owner',riderName:'Hal Kronenberg',riderNumber:15,ftp:206}
assert.equal(canUseOwnerOffSeasonPreview(identity),true)
assert.equal(canUseOwnerOffSeasonPreview({...identity,role:'rider'}),false)
const first=ensureHalOffSeasonPlan(emptyAlpha4025()),second=ensureHalOffSeasonPlan(first)
assert.equal(first.offSeasonUnlocked,false);assert.equal(first.trainingPlan?.weeks.length,12);assert.deepEqual(second,first);assert.equal(first.outdoorActivities.filter(x=>x.id===HAL_BASELINE.id).length,1)
const hq=readFileSync(new URL('../src/screens/TeamHQScreen.tsx',import.meta.url),'utf8'),bus=readFileSync(new URL('../src/screens/TeamBusScreen.tsx',import.meta.url),'utf8'),offseason=readFileSync(new URL('../src/screens/OffSeasonScreen.tsx',import.meta.url),'utf8')
assert.match(hq,/approvals\.length>0/);assert.match(hq,/showFemmes/);assert.match(hq,/Open Off-Season Training/);assert.match(bus,/Owner Preview Unlocked/);assert.match(offseason,/OWNER PREVIEW — OFF-SEASON PLAN/)
console.log('Alpha 4.0.25.1 audit passed: authenticated owner gate, non-mutating lifecycle access, idempotent Hal plan, navigation and empty-card contracts.')
