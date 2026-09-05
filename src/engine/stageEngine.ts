import type { RideSegment } from '../data/raceStages'
import { lifecycleForSegment, segmentPurposes, type RaceLifecycleState } from './raceLifecycle.ts'

export type StagePhase = 'ready' | 'racing' | 'climbing' | 'cooldown' | 'complete'

export type StageSnapshot = {
  lifecycle: RaceLifecycleState
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
  /** Canonical geographic coordinate. All professional-course rendering and events use this value. */
  courseDistance: number
  courseProgress: number
  riderPosition: number
  segmentStartProgress: number
  segmentEndProgress: number
  sectionStartCourseDistance: number
  sectionEndCourseDistance: number
  events: StageEvent[]
  courseComplete: boolean
  officialWorkoutComplete: boolean
  stageComplete: boolean
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
  const purposes=segmentPurposes(segments)
  segments.forEach((segment) => {
    segmentStarts.push(duration)
    duration += segment.sec
  })
  const totalDistance = routeDistanceKm ?? Math.max(...segments.map((item) => item.routeKm), 1)
  const routeStarts = segments.map(segment => Math.min(totalDistance, Math.max(0, segment.routeKm)))
  const firstRacing=purposes.findIndex(purpose=>purpose==='racing')
  const finalRacing=purposes.reduce((found,purpose,index)=>purpose==='racing'?index:found,-1)
  purposes.forEach((purpose,index)=>{if(purpose==='neutral-rollout'||purpose==='kilometre-zero')routeStarts[index]=0})
  if(firstRacing>=0)routeStarts[firstRacing]=0
  if(finalRacing>=0&&finalRacing<segments.length-1)routeStarts[finalRacing+1]=totalDistance
  const finalIndex=segments.length-1
  if(finalIndex>0&&purposes[finalIndex]==='post-finish-cooldown'&&segments[finalIndex].sec>0)routeStarts[finalIndex]=routeStarts[finalIndex-1]+(totalDistance-routeStarts[finalIndex-1])/2

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
      const sectionStartCourseDistance = routeStarts[segmentIndex]
      const sectionEndCourseDistance = Math.min(totalDistance, Math.max(sectionStartCourseDistance,
        routeStarts[segmentIndex + 1] ?? totalDistance))
      const sectionFraction = Math.min(1, Math.max(0, elapsedInSegment / Math.max(1, segment.sec)))
      const distance = complete ? totalDistance : Number((sectionStartCourseDistance
        + (sectionEndCourseDistance - sectionStartCourseDistance) * sectionFraction).toFixed(9))
      const events: StageEvent[] = []
      if (Math.floor(elapsed) === Math.floor(duration / 2)) events.push('stage-halfway')
      if (Math.floor(elapsedInSegment) === Math.floor(segment.sec / 2)) events.push('sector-halfway')
      if (Math.ceil(segment.sec - elapsedInSegment) === 30) events.push('final-30')
      if (Math.ceil(segment.sec - elapsedInSegment) === 10) events.push('final-10')
      if (elapsedInSegment < 1 && isClimb(segment)) events.push('climb-entry')
      if (elapsedInSegment < 1 && segmentIndex > 0 && isClimb(segments[segmentIndex - 1])) events.push('summit-exit')
      if (complete) events.push('finish')
      const lifecycle:RaceLifecycleState=complete?'FINISHED':lifecycleForSegment(purposes[segmentIndex])
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
        lifecycle,
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
        courseDistance: Math.min(totalDistance, distance),
        courseProgress: Math.min(1, distance / totalDistance),
        // Indoor time is piecewise mapped over authored real-course section bounds.
        // This normalized coordinate is therefore geographic, not elapsed-time progress.
        riderPosition: Math.min(1, distance / totalDistance),
        segmentStartProgress: segmentStarts[segmentIndex] / duration,
        segmentEndProgress: (segmentStarts[segmentIndex] + segment.sec) / duration,
        sectionStartCourseDistance,
        sectionEndCourseDistance,
        events,
        courseComplete: complete,
        officialWorkoutComplete: complete,
        stageComplete: complete,
      }
    },
  }
}

export type JeanTimelineEvent = {
  key: string
  at: number
  type: 'sector-entry' | 'kilometre-zero-warning' | 'kilometre-zero' | 'sprint-approach' | 'sprint' | 'climb-approach' | 'climb-entry' | 'summit-minute' | 'summit' | 'descent' | 'recovery' | 'finish-approach' | 'finish'
  segmentIndex: number
  courseDistance?: number
}

/** Deterministic coaching schedule generated from the same segment boundaries as snapshots. */
export function buildJeanTimeline(segments: RideSegment[], routeDistanceKm?: number): JeanTimelineEvent[] {
  const timeline = createStageTimeline(segments, routeDistanceKm)
  const events: JeanTimelineEvent[] = []
  segments.forEach((segment, index) => {
    const start = timeline.segmentStarts[index]
    const end = start + segment.sec
    const prior = segments[index - 1]
    events.push({ key: `sector-${index}`, at: start, type: 'sector-entry', segmentIndex: index })
    if (/kilometre zero|race start/i.test(`${segment.name} ${segment.type}`)) {
      if (start >= 30) events.push({ key: `kilometre-zero-warning-${index}`, at: start - 30, type: 'kilometre-zero-warning', segmentIndex: index })
      events.push({ key: `kilometre-zero-${index}`, at: start, type: 'kilometre-zero', segmentIndex: index })
    }
    if (/sprint/i.test(`${segment.name} ${segment.type}`) && !/finish/i.test(`${segment.name} ${segment.type}`)) {
      if (start >= 60) events.push({ key: `sprint-approach-${index}`, at: start - 60, type: 'sprint-approach', segmentIndex: index })
      events.push({ key: `sprint-${index}`, at: start, type: 'sprint', segmentIndex: index })
    }
    if (isClimb(segment)) {
      if (start >= 60) events.push({ key: `climb-approach-${index}`, at: start - 60, type: 'climb-approach', segmentIndex: index })
      events.push({ key: `climb-entry-${index}`, at: start, type: 'climb-entry', segmentIndex: index })
      if (segment.sec >= 75) events.push({ key: `summit-minute-${index}`, at: end - 60, type: 'summit-minute', segmentIndex: index })
    }
    if (prior && isClimb(prior)) events.push({ key: `summit-${index - 1}`, at: start, type: 'summit', segmentIndex: index })
    if (/descent/i.test(`${segment.name} ${segment.type}`)) events.push({ key: `descent-${index}`, at: start, type: 'descent', segmentIndex: index })
    else if (/recovery|cooldown|cool down/i.test(`${segment.name} ${segment.type}`)) events.push({ key: `recovery-${index}`, at: start, type: 'recovery', segmentIndex: index })
  })
  if (timeline.duration >= 60) events.push({ key: 'finish-approach', at: timeline.duration - 60, type: 'finish-approach', segmentIndex: segments.length - 1 })
  events.push({ key: 'finish', at: timeline.duration, type: 'finish', segmentIndex: segments.length - 1 })
  return events.sort((a, b) => a.at - b.at).map(event => ({
    ...event,
    courseDistance: timeline.snapshot(event.at).courseDistance,
  }))
}

/** One-time geographic crossing semantics for Jean and authoritative course markers. */
export function jeanCourseEventsCrossed(events: JeanTimelineEvent[], fromDistance: number, toDistance: number, fromElapsed?: number, toElapsed?: number) {
  if (toDistance < fromDistance) return []
  return events.filter(event => {
    if (event.courseDistance === undefined) return false
    if (event.courseDistance > fromDistance && event.courseDistance <= toDistance) return true
    // KM0/start-ramp cues can share a zero-length geographic interval. Time only
    // breaks that coordinate tie; it never supplies an alternative road position.
    return fromElapsed !== undefined && toElapsed !== undefined
      && event.courseDistance === fromDistance && event.courseDistance === toDistance
      && event.at > fromElapsed && event.at <= toElapsed
  })
}

export function jeanEventsCrossed(events: JeanTimelineEvent[], from: number, to: number) {
  if (to <= from) return []
  return events.filter((event) => event.at > from && event.at <= to)
}
