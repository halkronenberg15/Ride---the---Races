/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { RaceStrategy } from '../types/tactics'
import { elapsedFromClock, pauseClock, resumeClock, type PersistedRideClock } from '../engine/activeRideClock'
import type { DurationMode, DurationSelection } from '../engine/durationEngine'
import type { TacticalState, TacticalTransition } from '../engine/tacticalActions'
import type { TeamRadioMessage } from '../engine/teamRadio'

const KEY = 'ride-the-races-active-ride-v4.0.1'
export type ActiveRide = PersistedRideClock & { stageNumber: number; strategy: RaceStrategy; startedAt: string; library: string; workoutId?: string; durationMode:DurationMode; customDurationMinutes?:number; targetDurationMinutes?:number;tacticalState:TacticalState;tacticalTransition:TacticalTransition|null;pendingTacticalEventId:string|null;tacticalEventHistory:Array<{id:string;decision:string;at:number}>;activeTacticalEffort:{eventId:string;startedAt:number;durationSeconds:number;powerDeltaPercent:number}|null;sprintPhaseState:{name:string;sectorIndex:number}|null;recommendedTargetPairing:{cadence:number;resistance:number}|null;radioHistory:TeamRadioMessage[];earnedMarkerIds:string[];profileView:{mode:'OVERVIEW'|'DETAIL';activeRangeId:string|null;autoConsumedIds:string[]};worldsWarmupOffsetSeconds:number;preRaceSkipOffsetSeconds:number;preRacePhase:'PRE_RACE_WARMUP'|'KILOMETRE_ZERO'|'GO'|'RACING'|null;kilometreZeroDurationSeconds:number|null;officialStarted:boolean;profileGeographicMode:'FULL_STAGE'|'CLIMB';profileAutoTransitionId:string|null;tacticalOfferedAt:Record<string,number> }
type Value = { ride: ActiveRide | null; elapsed: number; begin: (stage: number, strategy: RaceStrategy, library?:string, workoutId?:string, duration?:DurationSelection) => void; pause: () => void; resume: () => void; updateRide:(patch:Partial<ActiveRide>)=>void; end: () => void }
const Context = createContext<Value | null>(null)

function restore(): ActiveRide | null {
  try { const ride=JSON.parse(localStorage.getItem(KEY) ?? 'null') as ActiveRide|null; return ride?{...ride,strategy:'Balanced',durationMode:ride.durationMode??'RECOMMENDED',tacticalState:ride.tacticalState??'PELOTON',tacticalTransition:ride.tacticalTransition??null,pendingTacticalEventId:ride.pendingTacticalEventId??null,tacticalEventHistory:ride.tacticalEventHistory??[],activeTacticalEffort:ride.activeTacticalEffort??null,sprintPhaseState:ride.sprintPhaseState??null,recommendedTargetPairing:ride.recommendedTargetPairing??null,radioHistory:ride.radioHistory??[],earnedMarkerIds:ride.earnedMarkerIds??[],profileView:ride.profileView??{mode:'OVERVIEW',activeRangeId:null,autoConsumedIds:[]},worldsWarmupOffsetSeconds:ride.worldsWarmupOffsetSeconds??0,preRaceSkipOffsetSeconds:ride.preRaceSkipOffsetSeconds??ride.worldsWarmupOffsetSeconds??0,preRacePhase:ride.preRacePhase??null,kilometreZeroDurationSeconds:ride.kilometreZeroDurationSeconds??null,officialStarted:ride.officialStarted??false,profileGeographicMode:ride.profileGeographicMode??'FULL_STAGE',profileAutoTransitionId:ride.profileAutoTransitionId??null,tacticalOfferedAt:ride.tacticalOfferedAt??{}}:null } catch { return null }
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
    begin(stageNumber, _strategy, library='tour-2026', workoutId, duration={mode:'RECOMMENDED'}) { setRide({ stageNumber, strategy:'Balanced', library, workoutId, durationMode:duration.mode, customDurationMinutes:duration.customMinutes, targetDurationMinutes:duration.targetMinutes, accumulatedSeconds: 0, runningSince: null, paused: true, startedAt: new Date().toISOString(),tacticalState:'PELOTON',tacticalTransition:null,pendingTacticalEventId:null,tacticalEventHistory:[],activeTacticalEffort:null,sprintPhaseState:null,recommendedTargetPairing:null,radioHistory:[],earnedMarkerIds:[],profileView:{mode:'OVERVIEW',activeRangeId:null,autoConsumedIds:[]},worldsWarmupOffsetSeconds:0,preRaceSkipOffsetSeconds:0,preRacePhase:null,kilometreZeroDurationSeconds:null,officialStarted:false,profileGeographicMode:'FULL_STAGE',profileAutoTransitionId:null,tacticalOfferedAt:{} }) },
    pause() { setRide((current) => current ? { ...current, ...pauseClock(current, Date.now()) } : null) },
    resume() { setRide((current) => current ? { ...current, ...resumeClock(current, Date.now()) } : null) },
    updateRide(patch){setRide(current=>current?{...current,...patch}:null)},
    end() { setRide(null) },
  }), [now, ride])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useActiveRide() {
  const value = useContext(Context)
  if (!value) throw new Error('useActiveRide must be used inside ActiveRideProvider')
  return value
}
