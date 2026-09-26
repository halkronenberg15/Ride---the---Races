export type PersistedRideClock = { accumulatedSeconds: number; runningSince: number | null; paused: boolean }

export function elapsedFromClock(clock: PersistedRideClock, now: number) {
  return Math.max(0, clock.accumulatedSeconds + (clock.runningSince === null ? 0 : (now - clock.runningSince) / 1000))
}

export function pauseClock(clock: PersistedRideClock, now: number): PersistedRideClock {
  if (clock.runningSince === null) return clock
  return { accumulatedSeconds: elapsedFromClock(clock, now), runningSince: null, paused: true }
}

export function resumeClock(clock: PersistedRideClock, now: number): PersistedRideClock {
  if (clock.runningSince !== null) return clock
  return { ...clock, runningSince: now, paused: false }
}
