import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { tour2026, toRaceStage, vuelta2026 } from '../data/professionalRaces.ts'
import { getAuthoritativeProfile, normalizeProfileForViewport, sampleProfileForSvg } from '../data/courseProfile.ts'
import { adaptSegment } from './adaptiveRide.ts'
import { createRoadModel } from './roadModel.ts'
import { composeSentences } from '../utils/text.ts'

test('Alpha 4.0.13 audits all 42 stages in one canonical distance domain', () => {
  for (const race of [tour2026, vuelta2026]) {
    assert.equal(race.stages.filter(stage => stage.verification.profile).length, 21)
    assert.equal(race.stages.filter(stage => stage.workoutReady && stage.rideable).length, 21)
    for (const source of race.stages) {
      const stage = toRaceStage(race, source)
      const road = createRoadModel(stage.number, stage.segments, stage.distanceKm, undefined, stage.profilePoints, stage.courseMarkers)
      let prior = -1
      for (let elapsed = 0; elapsed <= road.duration; elapsed += Math.max(1, road.duration / 100)) {
        const state = road.roadSnapshot(elapsed)
        assert.ok(state.courseDistance >= prior, `${race.name} Stage ${stage.number}: courseDistance reversed`)
        assert.ok(state.courseProgress >= 0 && state.courseProgress <= 1, `${race.name} Stage ${stage.number}: courseProgress out of bounds`)
        assert.equal(state.roadPosition, state.courseProgress, `${race.name} Stage ${stage.number}: riderPosition disagrees`)
        assert.equal(state.elevation, road.elevationAt(state.courseProgress), `${race.name} Stage ${stage.number}: rider elevation disagrees`)
        prior = state.courseDistance
      }
      const finish = road.roadSnapshot(road.duration)
      assert.equal(finish.courseDistance, stage.distanceKm, `${race.name} Stage ${stage.number}: finish distance`)
      assert.equal(finish.roadPosition, 1, `${race.name} Stage ${stage.number}: finish rider position`)
    }
  }
})

test('Vuelta Stage 15 shares course/workout, exact endpoints, and strategy cannot bend geography', () => {
  const source = vuelta2026.stages[14]
  const stage = toRaceStage(vuelta2026, source)
  assert.equal(stage.route, 'Palma del Río → Córdoba')
  assert.equal(stage.distanceKm, 190)
  assert.equal(source.indoorDurationMinutes, 42)
  assert.equal(stage.segments[0].routeKm, 0)
  assert.equal(stage.segments.at(-1)?.routeKm, 190)
  const balanced = createRoadModel(15, stage.segments, 190, undefined, stage.profilePoints)
  const aggressive = createRoadModel(15, stage.segments.map(section => adaptSegment(section, 250, 'Aggressive')), 190, undefined, stage.profilePoints)
  for (const elapsed of [0, balanced.duration * .25, balanced.duration * .5, balanced.duration]) {
    assert.equal(aggressive.roadSnapshot(elapsed).courseDistance, balanced.roadSnapshot(elapsed).courseDistance)
    assert.equal(aggressive.roadSnapshot(elapsed).profileY, balanced.roadSnapshot(elapsed).profileY)
  }
  assert.notEqual(aggressive.actionTargets(1).current.power, balanced.actionTargets(1).current.power)
  assert.equal(balanced.roadSnapshot(0).courseProgress, 0)
  assert.equal(balanced.roadSnapshot(balanced.duration).courseProgress, 1)
  assert.doesNotMatch(composeSentences('Settle before the rolling chain.', 'Prepare for Kilometre Zero'), /\.\.|!!|\?\?/) 
})

test('authoritative profile transformations are immutable and schematic styling is independent', () => {
  const source = vuelta2026.stages[14].profilePoints.map(point => Object.freeze({ ...point }))
  Object.freeze(source)
  const before = JSON.stringify(source)
  const authoritative = getAuthoritativeProfile({ profilePoints: source, verification: { profile: true } })
  normalizeProfileForViewport(authoritative, 190)
  sampleProfileForSvg(authoritative)
  createRoadModel(15, vuelta2026.stages[14].segments, 190, undefined, source)
  assert.equal(JSON.stringify(source), before)
  const detail = readFileSync(new URL('../screens/StageDetailScreen.tsx', import.meta.url), 'utf8')
  assert.match(detail, /map\.points/)
  assert.doesNotMatch(detail, /model\.profilePoints.*ROUTE SCHEMATIC/s)
  const css = readFileSync(new URL('../App.css', import.meta.url), 'utf8')
  assert.match(css, /\.course-details\{padding:0\}/)
})

test('Tour signature stages retain authoritative synchronized road models', () => {
  for (const number of [1, 9, 14, 16, 17, 18, 19, 20, 21]) {
    const stage = toRaceStage(tour2026, tour2026.stages[number - 1])
    const road = createRoadModel(number, stage.segments, stage.distanceKm, undefined, stage.profilePoints, stage.courseMarkers)
    assert.equal(road.profileSourceKind, 'authoritative', `Tour Stage ${number}`)
    assert.equal(road.roadSnapshot(road.duration).courseProgress, 1, `Tour Stage ${number}`)
  }
})
