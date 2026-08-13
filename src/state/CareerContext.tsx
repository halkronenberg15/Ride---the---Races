/* eslint-disable react-refresh/only-export-components -- Provider and its typed hook form one public state module. */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CareerState, HealthEntry, MeasurementSystem, RideMetricEntry } from '../types/career'

const STORAGE_KEY = 'ride-the-races-v2-career'

export const initialCareer: CareerState = {
  onboardingComplete: false,
  rider: {
    name: 'Hal Kronenberg',
    number: 15,
    nationality: 'USA',
    team: 'Équipe Loriot',
    archetype: 'GC Contender',
    ftp: 206,
    ftpKnown: true,
    experience: 'Recreational',
    seasonGoal: 'Improve fitness',
    devices: ['Peloton'],
  },
  season: {
    year: 2026,
    currentRace: 'Tour de France',
    currentStage: 1,
    completedStages: [1, 2],
  },
  races: {
    tour: { currentStage: 1, completedStages: [1, 2] },
    vuelta: { currentStage: 1, completedStages: [] },
  },
  trainingHistory: [],
  health: {
    date: new Date().toISOString().slice(0, 10),
    sleepHours: 7.5,
    recoveryScore: 82,
    restingHeartRate: 58,
    hrv: 52,
    fatigue: 24,
    mood: 'Good',
  },
  rideHistory: [],
  settings: {
    jeanVoiceEnabled: true,
    measurementSystem: 'imperial',
    jeanVoiceVolume: 1,
    theme: 'dark',
    reducedMotion: false,
    dailyReminders: false,
  },
}

export function migrateCareer(saved: Partial<CareerState>): CareerState {
  const legacyTour = { currentStage: saved.season?.currentStage ?? initialCareer.races.tour.currentStage, completedStages: saved.season?.completedStages ?? initialCareer.races.tour.completedStages }
  return {
    ...initialCareer,
    ...saved,
    onboardingComplete: saved.onboardingComplete ?? true,
    rider: { ...initialCareer.rider, ...saved.rider },
    season: { ...initialCareer.season, ...saved.season },
    races: { tour: { ...legacyTour, ...saved.races?.tour }, vuelta: { ...initialCareer.races.vuelta, ...saved.races?.vuelta } },
    trainingHistory: saved.trainingHistory ?? [],
    health: { ...initialCareer.health, ...saved.health },
    rideHistory: saved.rideHistory ?? [],
    settings: { ...initialCareer.settings, ...saved.settings },
  }
}

type CareerContextValue = {
  career: CareerState
  setCurrentStage: (stage: number) => void
  completeStage: (stage: number) => void
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
      setCareer((current) => ({ ...current, onboardingComplete: true, rider }))
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
