import type { RideSegment } from '../data/raceStages.ts'
import { buildGradientSections, gradientResistance, gradientSectionIndex, type GradientSection } from './gradientRoad.ts'
import { createStageTimeline, isClimb, type StageSnapshot, type StageTimeline } from './stageEngine.ts'
import { buildSprintPhases, sprintSnapshot, type SprintPhase, type SprintSnapshot } from './sprintPhases.ts'

export type RaceMarkerType = 'kilometre-zero' | 'sprint' | 'kom' | 'finish'
export type RaceMarker = { key: string; type: RaceMarkerType; label: string; position: number; at: number }
export type RoadPoint = { position: number; elevation: number }
export type RoadSnapshot = StageSnapshot & {
  roadPosition: number
  elevation: number
  profileY: number
  gradientSections: GradientSection[]
  gradientIndex: number
  gradient: number
  nextGradient: number
  climbProgress: number
  resistance: string
  sprintPhases: SprintPhase[]
  sprintPhase: SprintSnapshot | null
}

export type RoadModel = StageTimeline & {
  points: RoadPoint[]
  profilePoints: string[]
  markers: RaceMarker[]
  roadSnapshot: (elapsedSeconds: number) => RoadSnapshot
  elevationAt: (position: number) => number
}

const text = (segment: Pick<RideSegment, 'name' | 'type'>) => `${segment.name} ${segment.type}`

/** One road coordinate and geography shared by the tracker, gradients, resistance and coaching. */
export function createRoadModel(stageNumber: number, segments: RideSegment[], distanceKm: number): RoadModel {
  const timeline = createStageTimeline(segments, distanceKm)
  const sectionGradients = segments.map((segment, index) => isClimb(segment)
    ? buildGradientSections(`${stageNumber}-${index}-${segment.name}-${segment.type}`, segment.sec, segment.zone)
    : [])
  const sectionSprints = segments.map(buildSprintPhases)
  const raw: RoadPoint[] = [{ position: 0, elevation: 0 }]
  let elevation = 0
  segments.forEach((segment, index) => {
    const start = timeline.segmentStarts[index] / timeline.duration
    const end = (timeline.segmentStarts[index] + segment.sec) / timeline.duration
    const gradients = sectionGradients[index]
    if (gradients.length) {
      gradients.forEach((block) => {
        elevation += block.gradient * (end - start) * 1.8
        raw.push({ position: start + block.end * (end - start), elevation })
      })
    } else {
      const pitch = /descent/i.test(text(segment)) ? -3.2 : /recovery|cooldown/i.test(text(segment)) ? -0.5 : /rolling|hilly/i.test(text(segment)) ? 0.8 : 0.15
      elevation += pitch * (end - start) * 1.8
      raw.push({ position: end, elevation })
    }
  })
  const min = Math.min(...raw.map((point) => point.elevation))
  const max = Math.max(...raw.map((point) => point.elevation))
  const span = Math.max(1, max - min)
  const points = raw.map((point) => ({ ...point, elevation: 82 - ((point.elevation - min) / span) * 62 }))
  const elevationAt = (position: number) => {
    const p = Math.min(1, Math.max(0, position))
    const rightIndex = points.findIndex((point) => point.position >= p)
    if (rightIndex <= 0) return points[0].elevation
    const right = points[rightIndex]
    const left = points[rightIndex - 1]
    const local = (p - left.position) / Math.max(Number.EPSILON, right.position - left.position)
    return left.elevation + (right.elevation - left.elevation) * local
  }
  const markers: RaceMarker[] = []
  segments.forEach((segment, index) => {
    const start = timeline.segmentStarts[index]
    const position = start / timeline.duration
    if (/kilometre zero|race start/i.test(text(segment))) markers.push({ key: `km0-${index}`, type: 'kilometre-zero', label: 'KM 0', position, at: start })
    if (/sprint/i.test(text(segment)) && !/finish/i.test(text(segment))) {
      const at = start + segment.sec
      markers.push({ key: `sprint-${index}`, type: 'sprint', label: 'SPR', position: at / timeline.duration, at })
    }
    if (isClimb(segment)) {
      const at = start + segment.sec
      markers.push({ key: `kom-${index}`, type: 'kom', label: 'KOM', position: at / timeline.duration, at })
    }
  })
  markers.push({ key: 'finish', type: 'finish', label: 'FIN', position: 1, at: timeline.duration })

  return {
    ...timeline,
    points,
    profilePoints: points.map((point) => `${(point.position * 100).toFixed(3)},${point.elevation.toFixed(3)}`),
    markers,
    elevationAt,
    roadSnapshot(elapsedSeconds) {
      const base = timeline.snapshot(elapsedSeconds)
      const gradientSections = sectionGradients[base.segmentIndex]
      const sprintPhases = sectionSprints[base.segmentIndex]
      const sprintPhase = sprintSnapshot(sprintPhases, base.elapsedInSegment)
      const gradientIndex = gradientSectionIndex(gradientSections, base.segmentProgress)
      const gradient = gradientSections[gradientIndex]?.gradient ?? (/descent/i.test(text(base.segment)) ? -3.2 : 0)
      return {
        ...base,
        roadPosition: base.riderPosition,
        elevation: elevationAt(base.riderPosition),
        profileY: elevationAt(base.riderPosition),
        gradientSections,
        sprintPhases,
        sprintPhase,
        gradientIndex,
        gradient,
        nextGradient: gradientSections[Math.min(gradientIndex + 1, gradientSections.length - 1)]?.gradient ?? gradient,
        climbProgress: isClimb(base.segment) ? base.segmentProgress : 0,
        resistance: sprintPhase?.resistance ?? (gradientSections.length ? gradientResistance(base.segment, gradientSections, gradientIndex) : base.segment.resistance),
      }
    },
  }
}
