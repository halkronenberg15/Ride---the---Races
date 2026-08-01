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
}

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
      }
    },
  }
}
