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
import { getRaceStage } from './data/raceStages'

type Screen = 'hq' | 'teamBus' | 'tactics' | 'ride' | 'restDay' | 'rideData' | 'health' | 'profile' | 'settings' | 'finale'

function RideTheRacesApp() {
  const { career, setCurrentStage, completeStage, addRide } = useCareer()
  const [screen, setScreen] = useState<Screen>('hq')
  const restoredRide = (() => {
    try { return JSON.parse(localStorage.getItem('ride-the-races-active-v1') ?? 'null') as { strategy?: RaceStrategy } | null } catch { return null }
  })()
  const [raceStrategy, setRaceStrategy] = useState<RaceStrategy>(restoredRide?.strategy ?? 'Balanced')
  const [rideActive, setRideActive] = useState(Boolean(restoredRide))
  const [activeRideStatus, setActiveRideStatus] = useState({ sector: 'Preparing stage', elapsedSeconds: 0, remainingSeconds: 0 })

  useEffect(() => {
    const root = document.documentElement
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    const resolvedTheme = career.settings.theme === 'system' ? (prefersLight ? 'light' : 'dark') : career.settings.theme
    root.dataset.theme = resolvedTheme
    root.dataset.motion = career.settings.reducedMotion ? 'reduced' : 'full'
  }, [career.settings.theme, career.settings.reducedMotion])

  if (!career.onboardingComplete) return <OnboardingScreen />

  function handleFinishRide(ride: import('./types/career').RideMetricEntry) {
    const stage = career.season.currentStage
    addRide(ride)
    completeStage(stage)
<<<<<<< HEAD
    setRideActive(false)
    localStorage.removeItem('ride-the-races-active-v1')
=======
>>>>>>> origin/main
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
            setRideActive(true)
            setScreen('ride')
          }}
        />
      )}

      {rideActive && (
        <div hidden={screen !== 'ride'}>
          <RideScreen
          stageNumber={career.season.currentStage}
          strategy={raceStrategy}
          onBack={() => setScreen('tactics')}
          onFinish={handleFinishRide}
          onNavigate={setScreen}
          onStatus={setActiveRideStatus}
          onEnd={() => { localStorage.removeItem('ride-the-races-active-v1'); setRideActive(false); setScreen('hq') }}
          />
        </div>
      )}

      {rideActive && screen !== 'ride' && (
        <aside className="active-ride-bar">
          <div><small>ACTIVE RIDE • STAGE {career.season.currentStage} • {Math.floor(activeRideStatus.elapsedSeconds / 60)}:{String(Math.floor(activeRideStatus.elapsedSeconds % 60)).padStart(2, '0')}</small><strong>{getRaceStage(career.season.currentStage).route} • {activeRideStatus.sector}</strong></div>
          <div className="active-ride-actions">
            <button type="button" onClick={() => setScreen('ride')}>Resume Stage</button>
            <button type="button" onClick={() => { if (window.confirm('End this stage? Active progress will be discarded.')) { localStorage.removeItem('ride-the-races-active-v1'); setRideActive(false) } }}>End Stage</button>
          </div>
        </aside>
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
<<<<<<< HEAD
      <footer className="build-footer">Ride the Races • Alpha 4.0.1 | Synchronized Stage Engine</footer>
=======
      <footer className="build-footer">Ride the Races • Alpha 4.0 | Master Stage Engine</footer>
>>>>>>> origin/main
    </main>
  )
}

function App() {
  return <CareerProvider><RideTheRacesApp /></CareerProvider>
}

export default App
