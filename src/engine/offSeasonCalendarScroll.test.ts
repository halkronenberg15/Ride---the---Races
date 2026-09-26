import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source=readFileSync(new URL('../components/OffSeasonCalendar.tsx',import.meta.url),'utf8')

test('off-season calendar does not auto-scroll the selected day on rerender',()=>{
  assert.doesNotMatch(source,/scrollIntoView/)
  assert.match(source,/useMemo\(\(\)=>planMonths\(plan\),\[plan\]\)/)
})
