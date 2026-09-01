/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { RaceStrategy } from '../types/tactics'
import { elapsedFromClock, pauseClock, resumeClock, type PersistedRideClock } from '../engine/activeRideClock'
import type { DurationMode, DurationSelection } from '../engine/durationEngine'

const KEY = 'ride-the-races-active-ride-v4.0.1'
export type ActiveRide = PersistedRideClock & { stageNumber: number; strategy: RaceStrategy; startedAt: string; library: string; workoutId?: string; durationMode:DurationMode; customDurationMinutes?:number; targetDurationMinutes?:number }
type Value = { ride: ActiveRide | null; elapsed: number; begin: (stage: number, strategy: RaceStrategy, library?:string, workoutId?:string, duration?:DurationSelection) => void; pause: () => void; resume: () => void; end: () => void }
const Context = createContext<Value | null>(null)

function restore(): ActiveRide | null {
  try { const ride=JSON.parse(localStorage.getItem(KEY) ?? 'null') as ActiveRide|null; return ride?{...ride,durationMode:ride.durationMode??'RECOMMENDED'}:null } catch { return null }
}

export function ActiveRideProvider({ children }: { children: React.ReactNode }) {
  const [ride, setRide] = useState<ActiveRide | null>(restore)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(ride))
    if (!ride || ride.runningSince === null) return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [ride])
  const value = useMemo<Value>(() => ({
    ride,
    elapsed: ride ? elapsedFromClock(ride, now) : 0,
    begin(stageNumber, strategy, library='tour-2026', workoutId, duration={mode:'RECOMMENDED'}) { setRide({ stageNumber, strategy, library, workoutId, durationMode:duration.mode, customDurationMinutes:duration.customMinutes, targetDurationMinutes:duration.targetMinutes, accumulatedSeconds: 0, runningSince: null, paused: true, startedAt: new Date().toISOString() }) },
    pause() { setRide((current) => current ? { ...current, ...pauseClock(current, Date.now()) } : null) },
    resume() { setRide((current) => current ? { ...current, ...resumeClock(current, Date.now()) } : null) },
    end() { setRide(null) },
  }), [now, ride])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useActiveRide() {
  const value = useContext(Context)
  if (!value) throw new Error('useActiveRide must be used inside ActiveRideProvider')
  return value
}
