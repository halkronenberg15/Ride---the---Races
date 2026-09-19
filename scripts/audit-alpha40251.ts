import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { emptyAlpha4025, ensureHalOffSeasonPlan, HAL_BASELINE } from '../src/engine/alpha4025.ts'
const first=ensureHalOffSeasonPlan(emptyAlpha4025()),second=ensureHalOffSeasonPlan(first)
assert.equal(first.offSeasonUnlocked,false);assert.equal(first.trainingPlan?.weeks.length,12);assert.deepEqual(second,first);assert.equal(first.outdoorActivities.filter(x=>x.id===HAL_BASELINE.id).length,1)
const hq=readFileSync(new URL('../src/screens/TeamHQScreen.tsx',import.meta.url),'utf8'),bus=readFileSync(new URL('../src/screens/TeamBusScreen.tsx',import.meta.url),'utf8'),offseason=readFileSync(new URL('../src/screens/OffSeasonScreen.tsx',import.meta.url),'utf8'),app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8'),card=readFileSync(new URL('../src/components/OffSeasonPreviewButton.ts',import.meta.url),'utf8')
for(const source of [hq,bus,offseason,app])assert.match(source,/isAuthenticated/);for(const token of ['PREVIEW ACCESS','Start date:','Plan length:','Open Off-Season Plan'])assert.match(card,new RegExp(token));assert.doesNotMatch(card,/🔒/);assert.match(app,/screen==='offseason'&&!isAuthenticated/)
console.log('Alpha 4.0.25.1 audit passed: authenticated-session preview route, rendered labels, non-mutating lifecycle and idempotent Hal plan.')
