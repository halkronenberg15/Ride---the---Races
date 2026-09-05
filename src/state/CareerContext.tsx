/* eslint-disable react-refresh/only-export-components -- Provider and its typed hook form one public state module. */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CareerState, HealthEntry, MeasurementSystem, RideMetricEntry } from '../types/career'
import { equipmentForDevices, initialCareer, migrateCareer } from './careerPersistence.ts'

export { initialCareer, migrateCareer } from './careerPersistence.ts'

const STORAGE_KEY = 'ride-the-races-v2-career'

// Versioned defaults and migration are DOM-free for first-run regression coverage.

type CareerContextValue = {
  career: CareerState
  setCurrentStage: (stage: number) => void
  completeStage: (stage: number) => void
  selectRaceStage: (race: 'tour'|'vuelta', stage:number) => void
  completeRaceStage: (race:'tour'|'vuelta', stage:number) => void
  completeTraining: (workoutId:string,durationMinutes:number) => void
  addRide: (ride: RideMetricEntry) => void
  updateHealth: (entry: HealthEntry) => void
  updateRider: (rider: Partial<CareerState['rider']>) => void
  completeOnboarding: (rider: CareerState['rider']) => void
  restartOnboarding: () => void
  setJeanVoiceEnabled: (enabled: boolean) => void
  setMeasurementSystem: (system: MeasurementSystem) => void
  updateSettings: (settings: Partial<CareerState['settings']>) => void
}

const CareerContext = createContext<CareerContextValue | null>(null)

export function CareerProvider({ children }: { children: React.ReactNode }) {
  const [career, setCareer] = useState<CareerState>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      return saved ? migrateCareer(JSON.parse(saved) as Partial<CareerState>) : initialCareer
    } catch {
      return initialCareer
    }
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(career))
  }, [career])

  const value = useMemo<CareerContextValue>(() => ({
    career,
    setCurrentStage(stage) {
      setCareer((current) => ({ ...current, season: { ...current.season, currentStage: stage }, races: { ...current.races, tour: { ...current.races.tour, currentStage: stage } } }))
    },
    completeStage(stage) {
      setCareer((current) => ({
        ...current,
        season: {
          ...current.season,
          currentStage: Math.min(21, stage + 1),
          completedStages: Array.from(new Set([...current.season.completedStages, stage])).sort((a, b) => a - b),
        },
        races: { ...current.races, tour: { currentStage: Math.min(21, stage + 1), completedStages: Array.from(new Set([...current.races.tour.completedStages, stage])).sort((a,b)=>a-b) } },
      }))
    },
    selectRaceStage(race, stage) { setCareer(current=>({...current,races:{...current.races,[race]:{...current.races[race],currentStage:stage}},season:race==='tour'?{...current.season,currentStage:stage}:current.season})) },
    completeRaceStage(race, stage) { setCareer(current=>{const progress=current.races[race]; const completedStages=Array.from(new Set([...progress.completedStages,stage])).sort((a,b)=>a-b); return {...current,races:{...current.races,[race]:{currentStage:Math.min(21,stage+1),completedStages}},season:race==='tour'?{...current.season,currentStage:Math.min(21,stage+1),completedStages}:current.season} }) },
    completeTraining(workoutId,durationMinutes) { setCareer(current=>({...current,trainingHistory:[{workoutId,durationMinutes,completedAt:new Date().toISOString(),completed:true},...current.trainingHistory]})) },
    addRide(ride) {
      setCareer((current) => ({ ...current, rideHistory: [ride, ...current.rideHistory] }))
    },
    updateHealth(entry) {
      setCareer((current) => ({ ...current, health: entry }))
    },
    updateRider(rider) {
      setCareer((current) => ({ ...current, rider: { ...current.rider, ...rider } }))
    },
    completeOnboarding(rider) {
      setCareer((current) => ({ ...current, schemaVersion:3, onboardingComplete: true, rider, equipment:equipmentForDevices(rider.devices,rider.connectionMethod) }))
    },
    restartOnboarding() {
      setCareer((current) => ({ ...current, onboardingComplete: false }))
    },
    setJeanVoiceEnabled(enabled) {
      setCareer((current) => ({
        ...current,
        settings: { ...current.settings, jeanVoiceEnabled: enabled },
      }))
    },
    setMeasurementSystem(system) {
      setCareer((current) => ({
        ...current,
        settings: { ...current.settings, measurementSystem: system },
      }))
    },
    updateSettings(settings) {
      setCareer((current) => ({
        ...current,
        settings: { ...current.settings, ...settings },
      }))
    },
  }), [career])

  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>
}

export function useCareer() {
  const value = useContext(CareerContext)
  if (!value) throw new Error('useCareer must be used inside CareerProvider')
  return value
}
