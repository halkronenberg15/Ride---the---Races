import { useState } from 'react'
import packageMetadata from '../package.json'
import './App.css'
import TeamHQScreen from './screens/TeamHQScreen'
import TeamBusScreen from './screens/TeamBusScreen'
import RaceLibraryScreen from './screens/RaceLibraryScreen'
import TeamRosterScreen from './screens/TeamRosterScreen'
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
import { getRaceStage, raceStages } from './data/raceStages'
import SeasonCalendarScreen from './screens/SeasonCalendarScreen'
import { getSeason, seasons } from './data/seasonCalendar'
import { adaptSegments } from './engine/adaptiveRide'
import { createStageTimeline } from './engine/stageEngine'
import { getLibraryStage, trainingRides } from './data/raceLibrary'
import { actionableStage } from './utils/navigation'
import RaceOverviewScreen from './screens/RaceOverviewScreen'
import StageDetailScreen from './screens/StageDetailScreen'

type Screen = 'hq' | 'teamBus' | 'season' | 'race' | 'stageDetail' | 'training' | 'roster' | 'tactics' | 'ride' | 'restDay' | 'rideData' | 'health' | 'profile' | 'settings' | 'finale'

function RideTheRacesApp() {
  const { career, selectRaceStage, completeRaceStage, completeTraining, addRide } = useCareer()
  const [screen, setScreen] = useState<Screen>('hq')
  const [selectedSeason, setSelectedSeason] = useState(2026)
  const [selectedRace, setSelectedRace] = useState('tour-2026')
  const [selectedWorkout, setSelectedWorkout] = useState('recovery-30')
  const [selectedStageNumber, setSelectedStageNumber] = useState(1)
  const [raceStrategy, setRaceStrategy] = useState<RaceStrategy>('Balanced')
  const { ride, elapsed, end } = useActiveRide()

  useEffect(() => {
    const root = document.documentElement
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    const resolvedTheme = career.settings.theme === 'system' ? (prefersLight ? 'light' : 'dark') : career.settings.theme
    root.dataset.theme = resolvedTheme
    root.dataset.motion = career.settings.reducedMotion ? 'reduced' : 'full'
  }, [career.settings.theme, career.settings.reducedMotion])

  useEffect(() => {
    if (['race','stageDetail','tactics','ride'].includes(screen)) window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [screen])

  const tourActionable=actionableStage(career.races.tour,raceStages.map(stage=>stage.number))
  const vueltaActionable=actionableStage(career.races.vuelta,Array.from({length:9},(_,index)=>index+1))

  if (!career.onboardingComplete) return <OnboardingScreen />

  function handleFinishRide() {
    const stage = ride?.stageNumber ?? career.season.currentStage
    if (ride) {
      const stageData = getLibraryStage(ride.library,ride.stageNumber,ride.workoutId) ?? getRaceStage(ride.stageNumber)
      const plannedDurationSeconds = createStageTimeline(adaptSegments(stageData.segments, career.rider.ftp, ride.strategy), stageData.distanceKm).duration
      addRide({ id: crypto.randomUUID(), date: new Date().toISOString(), source: 'Manual', durationMinutes: Math.round(elapsed / 60), distanceKm: stageData.distanceKm, race: career.season.currentRace, stageNumber: ride.stageNumber, stageName: stageData.title, plannedDurationSeconds, actualEngineDurationSeconds: Math.round(elapsed), tactic: ride.strategy, ftp: career.rider.ftp, recovery: career.health })
    }
    end()
    if(ride?.library==='training') completeTraining(ride.workoutId??'training',Math.round(elapsed/60))
    else completeRaceStage(ride?.library==='vuelta-2026'?'vuelta':'tour',stage)
    setScreen('rideData')
  }

  return (
    <main className="app">
      {screen === 'hq' && (
        <TeamHQScreen
          onContinue={() => setScreen('teamBus')}
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
          onBack={() => setScreen('hq')}
          seasons={seasons}
          onOpenSeason={(year) => { setSelectedSeason(year); setScreen('season') }}
          onOpenTraining={() => { setSelectedRace('training'); setScreen('training') }}
          onOpenRoster={() => setScreen('roster')}
        />
      )}

      {screen === 'season' && getSeason(selectedSeason) && <SeasonCalendarScreen season={getSeason(selectedSeason)!} currentRace={career.season.currentRace} onBack={() => setScreen('teamBus')} onOpenRace={(raceId) => { setSelectedRace(raceId); setScreen('race') }} />}
      {screen === 'race' && <RaceOverviewScreen library={selectedRace} actionable={selectedRace==='vuelta-2026'?vueltaActionable:tourActionable} onBack={() => setScreen('season')} onOpenStage={(stage)=>{setSelectedStageNumber(stage);setScreen('stageDetail')}} />}
      {screen === 'stageDetail' && <StageDetailScreen library={selectedRace} stageNumber={selectedStageNumber} onBack={()=>setScreen('race')} onBriefing={()=>{selectRaceStage(selectedRace==='vuelta-2026'?'vuelta':'tour',selectedStageNumber);setScreen('tactics')}} />}
      {screen === 'training' && <RaceLibraryScreen library="training" selectedStageNumber={tourActionable} onSelectStage={()=>{}} onSelectWorkout={setSelectedWorkout} onBack={() => setScreen('teamBus')} onContinue={() => setScreen('tactics')} onOpenRestDay={() => setScreen('restDay')} />}
      {screen === 'roster' && <TeamRosterScreen onBack={() => setScreen('teamBus')} />}

      {screen === 'tactics' && (
        <TacticsScreen
          stageNumber={selectedRace==='training'?tourActionable:selectedStageNumber}
          stageData={selectedRace==='training'?getLibraryStage('training',trainingRides.find(r=>r.id===selectedWorkout)?.stage.number??30,selectedWorkout):getLibraryStage(selectedRace,selectedStageNumber)}
          onBack={() => setScreen(selectedRace==='training'?'training':'stageDetail')}
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
          stageNumber={ride?.stageNumber ?? selectedStageNumber}
          stageData={ride?getLibraryStage(ride.library,ride.stageNumber,ride.workoutId):getLibraryStage(selectedRace,selectedRace==='training'?trainingRides.find(r=>r.id===selectedWorkout)?.stage.number??tourActionable:selectedStageNumber,selectedWorkout)}
          library={ride?.library??selectedRace}
          workoutId={ride?.workoutId??(selectedRace==='training'?selectedWorkout:undefined)}
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
      <footer className="build-footer">Ride the Races • Alpha {packageMetadata.version} | Synchronized Stage Engine</footer>
    </main>
  )
}

function App() {
  return <CareerProvider><ActiveRideProvider><RideTheRacesApp /></ActiveRideProvider></CareerProvider>
}

export default App
