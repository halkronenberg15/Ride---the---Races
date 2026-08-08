import { useState } from 'react'
import './App.css'
import TeamHQScreen from './screens/TeamHQScreen'
import TeamBusScreen from './screens/TeamBusScreen'
import TacticsScreen from './screens/TacticsScreen'
import type { RaceStrategy } from './types/tactics'
import RideScreen from './screens/RideScreen'
import RestDayScreen from './screens/RestDayScreen'
import RideDataScreen from './screens/RideDataScreen'
import HealthScreen from './screens/HealthScreen'
import RiderProfileScreen from './screens/RiderProfileScreen'
import { CareerProvider, useCareer } from './state/CareerContext'
import OnboardingScreen from './screens/OnboardingScreen'
import SettingsScreen from './screens/SettingsScreen'
import { useEffect } from 'react'
import FinaleScreen from './screens/FinaleScreen'
import { ActiveRideProvider, useActiveRide } from './state/ActiveRideContext'
import { getRaceStage } from './data/raceStages'
import { adaptSegments } from './engine/adaptiveRide'
import { createStageTimeline } from './engine/stageEngine'

type Screen = 'hq' | 'teamBus' | 'tactics' | 'ride' | 'restDay' | 'rideData' | 'health' | 'profile' | 'settings' | 'finale'

function RideTheRacesApp() {
  const { career, setCurrentStage, completeStage, addRide } = useCareer()
  const [screen, setScreen] = useState<Screen>('hq')
  const [raceStrategy, setRaceStrategy] = useState<RaceStrategy>('Balanced')
  const { ride, elapsed, end } = useActiveRide()

  useEffect(() => {
    const root = document.documentElement
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    const resolvedTheme = career.settings.theme === 'system' ? (prefersLight ? 'light' : 'dark') : career.settings.theme
    root.dataset.theme = resolvedTheme
    root.dataset.motion = career.settings.reducedMotion ? 'reduced' : 'full'
  }, [career.settings.theme, career.settings.reducedMotion])

  if (!career.onboardingComplete) return <OnboardingScreen />

  function handleFinishRide() {
    const stage = ride?.stageNumber ?? career.season.currentStage
    if (ride) {
      const stageData = getRaceStage(ride.stageNumber)
      const plannedDurationSeconds = createStageTimeline(adaptSegments(stageData.segments, career.rider.ftp, ride.strategy), stageData.distanceKm).duration
      addRide({ id: crypto.randomUUID(), date: new Date().toISOString(), source: 'Manual', durationMinutes: Math.round(elapsed / 60), distanceKm: stageData.distanceKm, race: career.season.currentRace, stageNumber: ride.stageNumber, stageName: stageData.title, plannedDurationSeconds, actualEngineDurationSeconds: Math.round(elapsed), tactic: ride.strategy, ftp: career.rider.ftp, recovery: career.health })
    }
    end()
    completeStage(stage)
    setScreen('rideData')
  }

  return (
    <main className="app">
      {screen === 'hq' && (
        <TeamHQScreen
          onContinue={() => setScreen('teamBus')}
          onOpenRideData={() => setScreen('rideData')}
          onOpenHealth={() => setScreen('health')}
          onOpenProfile={() => setScreen('profile')}
          onOpenSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'rideData' && <RideDataScreen onBack={() => setScreen('hq')} />}
      {screen === 'health' && <HealthScreen onBack={() => setScreen('hq')} />}
      {screen === 'profile' && <RiderProfileScreen onBack={() => setScreen('hq')} />}
      {screen === 'settings' && <SettingsScreen onBack={() => setScreen('hq')} />}

      {screen === 'teamBus' && (
        <TeamBusScreen
          selectedStageNumber={career.season.currentStage}
          onSelectStage={setCurrentStage}
          onBack={() => setScreen('hq')}
          onContinue={() => setScreen('tactics')}
          onOpenRestDay={() => setScreen('restDay')}
        />
      )}

      {screen === 'tactics' && (
        <TacticsScreen
          stageNumber={career.season.currentStage}
          onBack={() => setScreen('teamBus')}
          onStartRide={(strategy) => {
            setRaceStrategy(strategy)
            setScreen('ride')
          }}
        />
      )}

      {ride && screen !== 'ride' && (
        <aside className="active-ride-bar"><strong>● ACTIVE RIDE · Stage {ride.stageNumber} · {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, '0')}</strong><button type="button" onClick={() => setScreen('ride')}>Resume Stage</button><button type="button" onClick={() => { if (window.confirm('End this active stage? This cannot be undone.')) end() }}>End Stage</button></aside>
      )}
      {screen === 'ride' && (
        <RideScreen
          stageNumber={ride?.stageNumber ?? career.season.currentStage}
          strategy={ride?.strategy ?? raceStrategy}
          onBack={() => setScreen('tactics')}
          onFinish={handleFinishRide}
        />
      )}

      {screen === 'finale' && (
        <FinaleScreen onReturnHome={() => setScreen('hq')} onReviewTour={() => setScreen('teamBus')} />
      )}

      {screen === 'restDay' && (
        <RestDayScreen
          onBackHome={() => setScreen('hq')}
          onReviewStages={() => setScreen('teamBus')}
        />
      )}
      <footer className="build-footer">Ride the Races • Alpha 4.0.1 | Synchronized Stage Engine</footer>
    </main>
  )
}

function App() {
  return <CareerProvider><ActiveRideProvider><RideTheRacesApp /></ActiveRideProvider></CareerProvider>
}

export default App
