import type { RideSegment } from '../data/raceStages.ts'

export type StartState = 'warm-up' | 'start-gate' | 'countdown-3' | 'countdown-2' | 'countdown-1' | 'go' | 'official'

export function isIndividualTimeTrial(segments: RideSegment[]) {
  return segments.some(segment => /time trial start|start ramp/i.test(`${segment.name} ${segment.type}`))
}

export function ttPreStageDuration(segments: RideSegment[]) {
  if (!isIndividualTimeTrial(segments)) return 0
  const firstOfficial = segments.findIndex(segment => !/warm-up|warmup|rollout|time trial start|start ramp/i.test(`${segment.name} ${segment.type}`))
  return (firstOfficial < 0 ? segments.length : firstOfficial)
    ? segments.slice(0, firstOfficial < 0 ? segments.length : firstOfficial).reduce((sum, segment) => sum + segment.sec, 0)
    : 0
}

/** Deterministic ride-clock TT gate. Official time cannot become positive before GO. */
export function ttStartSnapshot(segments: RideSegment[], rideElapsed: number) {
  const preStageDuration = ttPreStageDuration(segments)
  const remaining = Math.max(0, preStageDuration - rideElapsed)
  const officialElapsed = Math.max(0, rideElapsed - preStageDuration)
  let state: StartState = 'official'
  if (remaining > 30) state = 'warm-up'
  else if (remaining > 3) state = 'start-gate'
  else if (remaining > 2) state = 'countdown-3'
  else if (remaining > 1) state = 'countdown-2'
  else if (remaining > 0) state = 'countdown-1'
  else if (officialElapsed < 1) state = 'go'
  return { state, remaining, officialElapsed, preStageDuration, official: rideElapsed >= preStageDuration }
}

export function officialSegments(segments: RideSegment[]) {
  const pre = ttPreStageDuration(segments)
  if (!pre) return segments
  let elapsed = 0
  const index = segments.findIndex(segment => {
    if (elapsed >= pre) return true
    elapsed += segment.sec
    return false
  })
  return segments.slice(index < 0 ? segments.length : index)
}
