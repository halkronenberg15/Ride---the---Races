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
  elapsed: number
  routeDistanceKm: number
  riderPosition: number
  events: StageEvent[]
}

export type StageEvent = 'stage-halfway' | 'sector-halfway' | 'final-30' | 'final-10' | 'climb-entry' | 'summit-exit' | 'finish'

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
export function createStageTimeline(segments: RideSegment[], routeDistanceKm?: number): StageTimeline {
  if (segments.length === 0) throw new Error('A stage requires at least one segment')

  const segmentStarts: number[] = []
  let duration = 0
  segments.forEach((segment) => {
    segmentStarts.push(duration)
    duration += segment.sec
  })

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
      const nextRoute = segments[segmentIndex + 1]?.routeKm ?? routeDistanceKm ?? segment.routeKm
      const distance = Math.max(0, segment.routeKm + (nextRoute - segment.routeKm) * Math.min(1, Math.max(0, elapsedInSegment / Math.max(1, segment.sec))))
      const totalDistance = routeDistanceKm ?? Math.max(...segments.map((item) => item.routeKm), 1)
      const events: StageEvent[] = []
      if (Math.floor(elapsed) === Math.floor(duration / 2)) events.push('stage-halfway')
      if (Math.floor(elapsedInSegment) === Math.floor(segment.sec / 2)) events.push('sector-halfway')
      if (Math.ceil(segment.sec - elapsedInSegment) === 30) events.push('final-30')
      if (Math.ceil(segment.sec - elapsedInSegment) === 10) events.push('final-10')
      if (elapsedInSegment < 1 && isClimb(segment)) events.push('climb-entry')
      if (elapsedInSegment < 1 && segmentIndex > 0 && isClimb(segments[segmentIndex - 1])) events.push('summit-exit')
      if (complete) events.push('finish')
      const phase: StagePhase = complete
        ? 'complete'
        : isCooldown(segment)
          ? 'cooldown'
          : isClimb(segment)
            ? 'climbing'
            : elapsed === 0
              ? 'ready'
              : 'racing'

      return {
        phase,
        segment,
        segmentIndex,
        nextSegment: segments[segmentIndex + 1],
        elapsedInSegment,
        segmentRemaining: Math.max(0, segment.sec - elapsedInSegment),
        segmentProgress: Math.min(1, Math.max(0, elapsedInSegment / Math.max(1, segment.sec))),
        stageProgress: Math.min(1, elapsed / duration),
        stageRemaining: Math.max(0, duration - elapsed),
        elapsed,
        routeDistanceKm: Math.min(totalDistance, distance),
        riderPosition: Math.min(1, Math.max(0, distance / Math.max(0.001, totalDistance))),
        events,
      }
    },
  }
}
