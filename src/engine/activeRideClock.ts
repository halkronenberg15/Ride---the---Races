export type PersistedRideClock = { accumulatedSeconds: number; runningSince: number | null; paused: boolean }

export function elapsedFromClock(clock: PersistedRideClock, now: number) {
  return Math.max(0, clock.accumulatedSeconds + (clock.runningSince === null ? 0 : (now - clock.runningSince) / 1000))
}

export function pauseClock(clock: PersistedRideClock, now: number): PersistedRideClock {
  return { accumulatedSeconds: elapsedFromClock(clock, now), runningSince: null, paused: true }
}

export function resumeClock(clock: PersistedRideClock, now: number): PersistedRideClock {
  return { ...clock, runningSince: now, paused: false }
}

export function serializeRide<T extends PersistedRideClock>(ride: T | null) {
  return JSON.stringify(ride)
}

export function restoreRide<T extends PersistedRideClock>(value: string | null): T | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as T
    return typeof parsed.accumulatedSeconds === 'number' && (parsed.runningSince === null || typeof parsed.runningSince === 'number') ? parsed : null
  } catch { return null }
}
