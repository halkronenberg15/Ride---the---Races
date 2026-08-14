import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('Home is a persistent team headquarters', () => {
  const home = source('../screens/TeamHQScreen.tsx')
  assert.doesNotMatch(home, /TODAY'S STAGE|Today's Goal|JEAN'S WORD FOR TODAY|season-dashboard/)
  assert.match(home, /Recovery/)
  assert.match(home, /ENTER TEAM BUS/)
})
test('Team Bus uses season-first destinations', () => {
  const bus = source('../screens/TeamBusScreen.tsx')
  assert.match(bus, /SEASONS|seasons\.map/)
  assert.doesNotMatch(bus, /TOUR DE FRANCE|LA VUELTA/)
  assert.match(bus, /TRAINING RIDES|TEAM ROSTER/)
})
test('calendar is generated and race markers are accessible', () => {
  const calendar = source('../screens/SeasonCalendarScreen.tsx')
  assert.match(calendar, /monthNames\.map/)
  assert.match(calendar, /calendar-grid/)
  assert.match(calendar, /aria-label=.*Open race/)
  assert.match(calendar, /dayRaces\.map/)
})
