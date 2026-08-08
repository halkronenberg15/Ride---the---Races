import type { RideSegment } from '../data/raceStages'

export type StagePhase = 'ready' | 'racing' | 'climbing' | 'cooldown' | 'complete'

export type StageSnapshot = {
  phase: StagePhase
  segment: RideSegment
  segmentIndex: number
  nextSegment?: RideSegment
  elapsedInSegment: number
  segmentRemaining: number
  segmentProgress: number
  stageProgress: number
  stageRemaining: number
<<<<<<< HEAD
  routePosition: number
  routeKm: number
  events: StageEvent[]
}

export type StageEvent = 'sector-halfway' | 'final-30' | 'final-10' | 'summit' | 'finish'
export const PRE_RIDE_COUNTDOWN_SECONDS = 5

=======
}

>>>>>>> origin/main
export type StageTimeline = {
  duration: number
  segmentStarts: number[]
  snapshot: (elapsedSeconds: number) => StageSnapshot
}

const CLIMB_PATTERN = /climb|mountain|summit|col |côte|cote|alpe|pyren|ascent/i

export function isClimb(segment: Pick<RideSegment, 'name' | 'type'>) {
  return CLIMB_PATTERN.test(`${segment.name} ${segment.type}`)
}

export function isCooldown(segment: Pick<RideSegment, 'name' | 'type'>) {
  return /cooldown|cool down/i.test(`${segment.name} ${segment.type}`)
}

/** The single source of truth for stage time, phases, and segment transitions. */
export function createStageTimeline(segments: RideSegment[]): StageTimeline {
  if (segments.length === 0) throw new Error('A stage requires at least one segment')

  const segmentStarts: number[] = []
  let duration = 0
  segments.forEach((segment) => {
    segmentStarts.push(duration)
    duration += segment.sec
  })
<<<<<<< HEAD
  const routeDistance = Math.max(...segments.map((segment) => segment.routeKm), 1)
=======
>>>>>>> origin/main

  return {
    duration,
    segmentStarts,
    snapshot(elapsedSeconds) {
      const elapsed = Math.max(0, Math.min(duration, elapsedSeconds))
      let segmentIndex = segments.findIndex(
        (segment, index) => elapsed < segmentStarts[index] + segment.sec,
      )
      if (segmentIndex < 0) segmentIndex = segments.length - 1

      const segment = segments[segmentIndex]
      const elapsedInSegment = Math.min(segment.sec, elapsed - segmentStarts[segmentIndex])
      const complete = elapsed >= duration
      const phase: StagePhase = complete
        ? 'complete'
        : isCooldown(segment)
          ? 'cooldown'
          : isClimb(segment)
            ? 'climbing'
            : elapsed === 0
              ? 'ready'
              : 'racing'

<<<<<<< HEAD
      const segmentProgress = Math.min(1, Math.max(0, elapsedInSegment / Math.max(1, segment.sec)))
      const stageProgress = Math.min(1, elapsed / duration)
      const routeStart = segment.routeKm
      const routeEnd = segments[segmentIndex + 1]?.routeKm ?? segment.routeKm
      const routeKm = routeStart + Math.max(0, routeEnd - routeStart) * segmentProgress
      const events: StageEvent[] = []
      if (segmentProgress >= 0.5) events.push('sector-halfway')
      if (segment.sec - elapsedInSegment <= 30) events.push('final-30')
      if (segment.sec - elapsedInSegment <= 10) events.push('final-10')
      const previousSegment = segments[segmentIndex - 1]
      if (isClimb(segment) && segmentProgress >= 1) events.push('summit')
      if (previousSegment && isClimb(previousSegment) && elapsed === segmentStarts[segmentIndex]) events.push('summit')
      if (complete) events.push('finish')

=======
>>>>>>> origin/main
      return {
        phase,
        segment,
        segmentIndex,
        nextSegment: segments[segmentIndex + 1],
        elapsedInSegment,
        segmentRemaining: Math.max(0, segment.sec - elapsedInSegment),
<<<<<<< HEAD
        segmentProgress,
        stageProgress,
        stageRemaining: Math.max(0, duration - elapsed),
        routePosition: Math.min(1, routeKm / routeDistance),
        routeKm,
        events,
=======
        segmentProgress: Math.min(1, Math.max(0, elapsedInSegment / Math.max(1, segment.sec))),
        stageProgress: Math.min(1, elapsed / duration),
        stageRemaining: Math.max(0, duration - elapsed),
>>>>>>> origin/main
      }
    },
  }
}
<<<<<<< HEAD

export type ResistanceRecommendation = { min: number; max: number; midpoint: number }

export function gradientToResistance(
  gradient: number,
  envelope: { min: number; max: number },
): ResistanceRecommendation {
  const width = envelope.max - envelope.min
  const normalized = Math.min(1, Math.max(0, (gradient - 4) / 6))
  const midpoint = Math.round(envelope.min + 1 + normalized * Math.max(0, width - 2))
  const min = Math.max(envelope.min, midpoint - 1)
  return { min, max: Math.min(envelope.max, min + 2), midpoint }
}

export function parseResistanceEnvelope(value: string) {
  const match = value.replace(/[–—]/g, '-').match(/(\d+)\s*-\s*(\d+)/)
  return match ? { min: Number(match[1]), max: Number(match[2]) } : { min: 35, max: 55 }
}
=======
>>>>>>> origin/main
