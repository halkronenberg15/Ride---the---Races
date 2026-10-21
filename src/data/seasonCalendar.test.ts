import assert from 'node:assert/strict'
import test from 'node:test'
import { getCalendarMonth, getInitialMonth, seasons } from './seasonCalendar.ts'

test('calendar derives correct 2026 month geometry', () => {
  assert.deepEqual(getCalendarMonth(2026, 0), { leadingDays: 4, dayCount: 31 })
  assert.deepEqual(getCalendarMonth(2026, 1), { leadingDays: 0, dayCount: 28 })
  assert.deepEqual(getCalendarMonth(2026, 3), { leadingDays: 3, dayCount: 30 })
  assert.deepEqual(getCalendarMonth(2028, 1), { leadingDays: 2, dayCount: 29 })
})

test('season model supports multiple race markers and relevant initial month', () => {
  const season = seasons[0]
  assert.equal(season.races.find((race) => race.id === 'vuelta-2026')?.startDate, '2026-08-22')
  assert.ok(season.races.filter((race) => race.startDate.startsWith('2026-09')).length > 0)
  assert.equal(getInitialMonth(season, 'La Vuelta'), 6, 'active race takes priority over selected race')
  const noActive = { ...season, races: season.races.map((race) => ({ ...race, status: 'planned' as const })) }
  assert.equal(getInitialMonth(noActive, 'La Vuelta'), 7)
})


test('2027 calendar includes confirmed major RtR targets',()=>{
 const season=getSeason(2027)
 assert(season)
 assert.equal(season?.races.find(r=>r.id==='tour-2027')?.startDate,'2027-07-02')
 assert.equal(season?.races.find(r=>r.id==='giro-2027')?.startDate,'2027-05-08')
 assert.equal(season?.races.find(r=>r.id==='vuelta-2027')?.startDate,'2027-09-04')
 assert.equal(season?.races.find(r=>r.id==='worlds-2027')?.startDate,'2027-08-24')
 assert.equal(seasons.some(s=>s.year===2027),true)
})
