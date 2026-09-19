import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { emptyAlpha4025, ensureHalOffSeasonPlan, HAL_BASELINE } from '../src/engine/alpha4025.ts'
const first=ensureHalOffSeasonPlan(emptyAlpha4025()),second=ensureHalOffSeasonPlan(first)
assert.equal(first.offSeasonUnlocked,false);assert.equal(first.trainingPlan?.weeks.length,12);assert.deepEqual(second,first);assert.equal(first.outdoorActivities.filter(x=>x.id===HAL_BASELINE.id).length,1)
const hq=readFileSync(new URL('../src/screens/TeamHQScreen.tsx',import.meta.url),'utf8'),bus=readFileSync(new URL('../src/screens/TeamBusScreen.tsx',import.meta.url),'utf8'),offseason=readFileSync(new URL('../src/screens/OffSeasonScreen.tsx',import.meta.url),'utf8')
assert.match(hq,/ownerPreview=!career\.alpha4025\.offSeasonUnlocked&&isOwner/);assert.match(bus,/ownerPreview=!career\.alpha4025\.offSeasonUnlocked&&isOwner/);assert.match(offseason,/ownerPreview=!state\.offSeasonUnlocked&&isOwner/);assert.match(hq,/approvals\.length>0/);assert.match(hq,/showFemmes/);assert.match(hq,/Open Off-Season Training/);for(const token of ['OWNER PREVIEW — OFF-SEASON PLAN','Owner Preview Unlocked','Start date: September 21, 2026','Plan length: 12 weeks','Open Off-Season Plan'])assert.match(bus,new RegExp(token))
console.log('Alpha 4.0.25.1 audit passed: authenticated owner gate, non-mutating lifecycle access, idempotent Hal plan, navigation and empty-card contracts.')
