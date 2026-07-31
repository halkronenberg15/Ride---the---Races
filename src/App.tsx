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
import UnitToggle from './components/UnitToggle'
import SettingsScreen from './screens/SettingsScreen'
import { useEffect } from 'react'
import FinaleScreen from './screens/FinaleScreen'

type Screen = 'hq' | 'teamBus' | 'tactics' | 'ride' | 'restDay' | 'rideData' | 'health' | 'profile' | 'settings' | 'finale'

function RideTheRacesApp() {
  const { career, setCurrentStage, completeStage } = useCareer()
  const [screen, setScreen] = useState<Screen>('hq')
  const [raceStrategy, setRaceStrategy] = useState<RaceStrategy>('Balanced')

  useEffect(() => {
    const root = document.documentElement
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    const resolvedTheme = career.settings.theme === 'system' ? (prefersLight ? 'light' : 'dark') : career.settings.theme
    root.dataset.theme = resolvedTheme
    root.dataset.motion = career.settings.reducedMotion ? 'reduced' : 'full'
  }, [career.settings.theme, career.settings.reducedMotion])

  if (!career.onboardingComplete) return <OnboardingScreen />

  function handleFinishRide() {
    const stage = career.season.currentStage
    completeStage(stage)
    if (stage === 21) {
      setScreen('finale')
      return
    }
    if (stage === 9 || stage === 15) {
      setScreen('restDay')
      return
    }
    setScreen('teamBus')
  }

  return (
    <main className="app">
      <UnitToggle />
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

      {screen === 'ride' && (
        <RideScreen
          stageNumber={career.season.currentStage}
          strategy={raceStrategy}
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
      <footer className="build-footer">Ride the Races • Alpha 3.7 | Full-Length Stages</footer>
    </main>
  )
}

function App() {
  return <CareerProvider><RideTheRacesApp /></CareerProvider>
}

export default App
