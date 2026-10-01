import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source=readFileSync(new URL('../components/OffSeasonCalendar.tsx',import.meta.url),'utf8')

test('off-season calendar does not auto-scroll the selected day on rerender',()=>{
  assert.doesNotMatch(source,/scrollIntoView/)
  assert.match(source,/useMemo\(\(\)=>planMonths\(plan\),\[plan\]\)/)
})

test('off-season month selector is not snapped back by the selected training date',()=>{
  assert.match(source,/\[selectedDate,months\]\)/)
  assert.doesNotMatch(source,/\[selectedDate,months,activeMonthIndex\]\)/)
})
