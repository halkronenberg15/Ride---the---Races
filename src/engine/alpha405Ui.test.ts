import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
test('full section preview lives in Race Briefing and not live cockpit', () => {
  const briefing = source('../screens/TacticsScreen.tsx')
  const cockpit = source('../screens/RideScreen.tsx')
  assert.match(briefing, /StageSectionPreview/)
  assert.doesNotMatch(cockpit, /STAGE SECTION PREVIEW|SECTION PREVIEW · DOES NOT CHANGE/)
  assert.ok(briefing.indexOf('StageSectionPreview') < briefing.indexOf('strategy-selector'))
})
test('Team Bus is navigation-only and Tour calendar is dedicated', () => {
  const bus = source('../screens/TeamBusScreen.tsx')
  const roadbook = source('../screens/RaceLibraryScreen.tsx')
  const app = source('../App.tsx')
  assert.doesNotMatch(bus, /raceStages|calendar-stage-list/)
  assert.match(bus, /seasons\.map/)
  assert.match(roadbook, /raceStages\.map/)
  assert.match(app, /screen === 'season'/)
  assert.match(app, /onContinue=\{\(\) => setScreen\('tactics'\)\}/)
})
