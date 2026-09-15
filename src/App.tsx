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
import { applyDurationSelection, durationSelectionForStage, type DurationSelection } from './engine/durationEngine'
import WorldsHubScreen from './screens/WorldsHubScreen'
import WorldsBriefingScreen from './screens/WorldsBriefingScreen'
import { worldsStage } from './data/uciWorlds2026'
import { AuthProvider, useAuth } from './state/AuthContext.tsx'
import AuthScreen from './screens/AuthScreen.tsx'
import { createRoadModel } from './engine/roadModel.ts'
import { bikeProfileForEquipment, GENERIC_MANUAL_EQUIPMENT } from './engine/manualBike.ts'
import { tacticalPrescription } from './engine/alpha4021.ts'
import { PRESCRIPTION_RULE_VERSION, noFtpTarget, prescriptionSnapshot, type OriginalTargetSnapshot } from './engine/release4024.ts'

type Screen = 'hq' | 'teamBus' | 'season' | 'race' | 'worldsBriefing' | 'stageDetail' | 'training' | 'roster' | 'tactics' | 'ride' | 'restDay' | 'rideData' | 'health' | 'profile' | 'settings' | 'finale'|'femmes'

function RideTheRacesApp() {
  const { career, selectRaceStage, completeRaceStage, completeTraining, completeWorlds, addRide } = useCareer()
  const {canAccess}=useAuth()
  const [screen, setScreen] = useState<Screen>('hq')
  const [selectedSeason, setSelectedSeason] = useState(2026)
  const [selectedRace, setSelectedRace] = useState('tour-2026')
  const [selectedWorkout, setSelectedWorkout] = useState('recovery-30')
  const [selectedStageNumber, setSelectedStageNumber] = useState(1)
  const [raceStrategy, setRaceStrategy] = useState<RaceStrategy>('Balanced')
  const [rideDuration,setRideDuration]=useState<DurationSelection>({mode:'RECOMMENDED'})
  const [stageReplay,setStageReplay]=useState(false)
  const [replayOriginal,setReplayOriginal]=useState<{rideId:string;ftp:number|null;targetSnapshots:OriginalTargetSnapshot[]}|null>(null)
  const { ride, elapsed, end } = useActiveRide()

  useEffect(() => {
    const root = document.documentElement
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    const resolvedTheme = career.settings.theme === 'system' ? (prefersLight ? 'light' : 'dark') : career.settings.theme
    root.dataset.theme = resolvedTheme
    root.dataset.motion = career.settings.reducedMotion ? 'reduced' : 'full'
  }, [career.settings.theme, career.settings.reducedMotion])

  useEffect(()=>{const viewport=window.visualViewport;const sync=()=>document.documentElement.style.setProperty('--visual-viewport-top',`${Math.max(0,viewport?.offsetTop??0)}px`);sync();viewport?.addEventListener('resize',sync);viewport?.addEventListener('scroll',sync);return()=>{viewport?.removeEventListener('resize',sync);viewport?.removeEventListener('scroll',sync)}},[])

  useEffect(() => {
    if (['race','stageDetail','tactics','ride'].includes(screen)) window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [screen])

  const tourActionable=actionableStage(career.races.tour,raceStages.map(stage=>stage.number))
  const vueltaActionable=actionableStage(career.races.vuelta,Array.from({length:9},(_,index)=>index+1))

  if (!career.onboardingComplete) return <OnboardingScreen />
  const protectedRaceScreen=['season','race','worldsBriefing','stageDetail'].includes(screen)||(screen==='tactics'&&selectedRace!=='training')||(screen==='ride'&&(ride?.library??selectedRace)!=='training')
  if(protectedRaceScreen&&!canAccess('rtr-standard'))return <section className="auth-screen"><div className="auth-card" role="alert"><p className="eyebrow">PROGRAM ACCESS</p><h1>Program not assigned</h1><p>This account is not entitled to this protected RtR program. Request it from the Intro Cycling dashboard or contact the owner.</p><button type="button" onClick={()=>setScreen('hq')}>Return to dashboard</button></div></section>
  if(screen==='femmes'&&!canAccess('rtr-femmes'))return <section className="auth-screen"><div className="auth-card" role="alert"><h1>RtR Femmes not assigned</h1><p>Local-development owner approval is required.</p><button type="button" onClick={()=>setScreen('hq')}>Return to dashboard</button></div></section>

  function handleFinishRide(cooldown={officialRaceDurationSeconds:0,cooldownDurationSeconds:0,cooldownSkipped:false}) {
    const stage = ride?.stageNumber ?? career.season.currentStage
    if (ride) {
      const stageData = getLibraryStage(ride.library,ride.stageNumber,ride.workoutId) ?? getRaceStage(ride.stageNumber)
      const selection=durationSelectionForStage(stageData,{mode:ride.durationMode,customMinutes:ride.customDurationMinutes,targetMinutes:ride.targetDurationMinutes})
      const adapted=adaptSegments(stageData.segments,career.rider.ftp??150,ride.strategy),resolvedSegments=stageData.isTraining?adapted:applyDurationSelection(adapted,selection).segments
      const plannedDurationSeconds=createStageTimeline(resolvedSegments,stageData.distanceKm).duration
      const equipment=career.equipment.instances.find(item=>item.id===career.equipment.activeEquipmentId)??GENERIC_MANUAL_EQUIPMENT,model=createRoadModel(stageData.number,resolvedSegments,stageData.distanceKm,undefined,stageData.profilePoints,stageData.officialCourseMarkers,stageData.raceId,career.rider.ftp??150,equipment,career.rider.cadencePreferences)
      const targetSnapshots:OriginalTargetSnapshot[]=resolvedSegments.map((segment,index)=>{const base=prescriptionSnapshot(index,segment,tacticalPrescription(model.roadSnapshot(model.segmentStarts[index]).livePrescription,1,equipment,bikeProfileForEquipment(equipment),career.rider.cadencePreferences)),safe=career.rider.ftp===null&&ride.library==='training'?noFtpTarget(segment,equipment,career.rider.introEffortBaseline):null;return {...base,...(safe?{power:safe.power,cadence:safe.cadence,resistance:safe.resistance}:{}),sectionIndex:index,equipmentId:equipment.id,equipmentMode:equipment.calibrationProfileId?'PELOTON_COMPATIBLE':equipment.powerAvailable?'POWER_GUIDED':'RPE_LOAD',calibrationConfidence:equipment.calibrationConfidence,ftp:career.rider.ftp,ftpProvenance:career.rider.ftpProvenance,tacticalModifier:1,ruleVersion:PRESCRIPTION_RULE_VERSION}})
      addRide({ id: crypto.randomUUID(), activityType:ride.activityType??(ride.library==='training'?(ride.workoutId==='intro-calibration'?'CALIBRATION':ride.workoutId?.startsWith('intro-')?'INTRO':'TRAINING'):'RACE_STAGE'), date: new Date().toISOString(), source: 'Manual', durationMinutes: Math.round(elapsed / 60), distanceKm: stageData.distanceKm, race: career.season.currentRace, stageNumber: ride.stageNumber, stageName: stageData.title, plannedDurationSeconds, actualEngineDurationSeconds: Math.round(elapsed), tactic: ride.strategy, ftp: career.rider.ftp??undefined,ftpProvenance:career.rider.ftpProvenance,equipmentId:career.equipment.activeEquipmentId??undefined,selectedDurationVersion:ride.durationMode,targetSnapshots:ride.activityType==='STAGE_REPLAY'&&replayOriginal?replayOriginal.targetSnapshots:targetSnapshots,originalRideId:ride.activityType==='STAGE_REPLAY'?replayOriginal?.rideId:undefined, recovery: career.health,earnedMarkerIds:ride.earnedMarkerIds,officialRaceDurationSeconds:cooldown.officialRaceDurationSeconds,cooldownDurationSeconds:cooldown.cooldownDurationSeconds,cooldownSkipped:cooldown.cooldownSkipped })
    }
    end()
    if(ride?.library==='training') completeTraining(ride.workoutId??'training',Math.round(elapsed/60))
    else if(ride?.library==='worlds-2026') completeWorlds(ride.stageNumber===1?'men-elite-itt':'men-elite-road-race',undefined,ride.earnedMarkerIds.filter(id=>id.includes('itt-split')))
    else if(ride?.activityType!=='STAGE_REPLAY') completeRaceStage(ride?.library==='vuelta-2026'?'vuelta':'tour',stage)
    setStageReplay(false);setScreen(ride?.library==='worlds-2026'?'season':'rideData')
  }
  function handleEndRideEarly(reason:string,snapshot:{completionPercentage:number;distanceKm:number;lifecycle:string;sector:string;completedSectors:string[];earnedMarkerIds:string[];tacticalState:string}){
    if(ride)addRide({id:crypto.randomUUID(),date:new Date().toISOString(),source:'Manual',durationMinutes:Math.round(elapsed/60),distanceKm:snapshot.distanceKm,race:career.season.currentRace,stageNumber:ride.stageNumber,stageName:getLibraryStage(ride.library,ride.stageNumber,ride.workoutId)?.title,actualEngineDurationSeconds:Math.round(elapsed),tactic:ride.strategy,ftp:career.rider.ftp??undefined,ftpProvenance:career.rider.ftpProvenance,equipmentId:career.equipment.activeEquipmentId??undefined,activityType:ride.library==='training'?'TRAINING':'RACE_STAGE',recovery:career.health,terminatedEarly:true,terminationReason:reason,completionPercentage:snapshot.completionPercentage,lifecycleAtTermination:snapshot.lifecycle,sectorAtTermination:snapshot.sector,completedSectors:snapshot.completedSectors,earnedMarkerIds:snapshot.earnedMarkerIds,tacticalState:snapshot.tacticalState})
    end();setScreen('rideData')
  }

  return (
    <main className="app">
      {screen === 'hq' && (
        <TeamHQScreen
          onContinue={() => setScreen('teamBus')}
          onStartIntro={(workoutId)=>{setSelectedRace('training');setSelectedWorkout(workoutId);setScreen('tactics')}}
          onOpenFemmes={()=>setScreen('femmes')}
          onOpenHealth={() => setScreen('health')}
          onOpenProfile={() => setScreen('profile')}
          onOpenSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'rideData' && <RideDataScreen onBack={() => setScreen('hq')} />}
      {screen === 'femmes'&&<section className="dashboard-card"><p className="eyebrow">PROTECTED PROGRAM</p><h1>RtR Femmes</h1><p>Your account is approved. The full ride library is intentionally not authored in Alpha 4.0.24.</p><button type="button" onClick={()=>setScreen('hq')}>Return to dashboard</button></section>}
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
          onOpenStageResults={()=>setScreen('rideData')}
          onReplayStage={(stage,useOriginal)=>{const original=career.rideHistory.find(item=>item.stageNumber===stage&&item.activityType!=='STAGE_REPLAY'&&item.targetSnapshots?.length);setReplayOriginal(useOriginal&&original?.targetSnapshots?.length?{rideId:original.id,ftp:original.ftp??null,targetSnapshots:original.targetSnapshots}:null);setStageReplay(true);setSelectedRace('tour-2026');setSelectedStageNumber(stage);setScreen('tactics')}}
        />
      )}

      {screen === 'season' && getSeason(selectedSeason) && <SeasonCalendarScreen season={getSeason(selectedSeason)!} currentRace={career.season.currentRace} onBack={() => setScreen('teamBus')} onOpenRace={(raceId) => { setSelectedRace(raceId); setScreen('race') }} />}
      {screen === 'race' && (selectedRace==='worlds-2026'?<WorldsHubScreen onBack={()=>setScreen('season')} onOpen={(event)=>{setSelectedStageNumber(event);setScreen('worldsBriefing')}}/>:<RaceOverviewScreen library={selectedRace} actionable={selectedRace==='vuelta-2026'?vueltaActionable:tourActionable} onBack={() => setScreen('season')} onOpenStage={(stage)=>{setSelectedStageNumber(stage);setScreen('stageDetail')}} />)}
      {screen === 'worldsBriefing'&&<WorldsBriefingScreen event={selectedStageNumber as 1|2} onBack={()=>setScreen('race')} onStart={(minutes)=>{setRideDuration({mode:'CUSTOM',customMinutes:minutes,targetMinutes:minutes});setRaceStrategy('Balanced');setScreen('ride')}}/>}
      {screen === 'stageDetail' && <StageDetailScreen library={selectedRace} stageNumber={selectedStageNumber} durationSelection={ride?.stageNumber===selectedStageNumber?{mode:ride.durationMode,customMinutes:ride.customDurationMinutes,targetMinutes:ride.targetDurationMinutes}:undefined} onBack={()=>setScreen('race')} onOpenResults={()=>setScreen('rideData')} onBriefing={()=>{selectRaceStage(selectedRace==='vuelta-2026'?'vuelta':'tour',selectedStageNumber);setScreen('tactics')}} />}
      {screen === 'training' && <RaceLibraryScreen library="training" selectedStageNumber={tourActionable} onSelectStage={()=>{}} onSelectWorkout={setSelectedWorkout} onBack={() => setScreen('teamBus')} onContinue={() => setScreen('tactics')} onOpenRestDay={() => setScreen('restDay')} />}
      {screen === 'roster' && <TeamRosterScreen onBack={() => setScreen('teamBus')} />}

      {screen === 'tactics' && (
        <TacticsScreen
          stageNumber={selectedRace==='training'?tourActionable:selectedStageNumber}
          stageData={selectedRace==='training'?getLibraryStage('training',trainingRides.find(r=>r.id===selectedWorkout)?.stage.number??30,selectedWorkout):getLibraryStage(selectedRace,selectedStageNumber)}
          onBack={() => setScreen(selectedRace==='training'?'training':'stageDetail')}
          onStartRide={(strategy,duration) => {
            setRaceStrategy(strategy)
            setRideDuration(duration)
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
          stageData={ride?getLibraryStage(ride.library,ride.stageNumber,ride.workoutId):selectedRace==='worlds-2026'?worldsStage(selectedStageNumber===1?'itt':'road',rideDuration.customMinutes):getLibraryStage(selectedRace,selectedRace==='training'?trainingRides.find(r=>r.id===selectedWorkout)?.stage.number??tourActionable:selectedStageNumber,selectedWorkout)}
          library={ride?.library??selectedRace}
          workoutId={ride?.workoutId??(selectedRace==='training'?selectedWorkout:undefined)}
          activityType={ride?.activityType??(stageReplay?'STAGE_REPLAY':selectedRace==='training'?(selectedWorkout==='intro-calibration'?'CALIBRATION':selectedWorkout.startsWith('intro-')?'INTRO':'TRAINING'):'RACE_STAGE')}
          targetFtpOverride={stageReplay?replayOriginal?.ftp??undefined:undefined}
          originalTargetSnapshots={stageReplay?replayOriginal?.targetSnapshots:undefined}
          strategy={ride?.strategy ?? raceStrategy}
          durationSelection={ride?{mode:ride.durationMode,customMinutes:ride.customDurationMinutes,targetMinutes:ride.targetDurationMinutes}:rideDuration}
          onBack={() => setScreen(selectedRace==='worlds-2026'?'worldsBriefing':'tactics')}
          onFinish={handleFinishRide}
          onEndEarly={handleEndRideEarly}
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
  return <AuthProvider><AuthenticatedApp/></AuthProvider>
}

function AuthenticatedApp(){const {account}=useAuth();if(!account)return <AuthScreen/>;return <CareerProvider key={account.id}><ActiveRideProvider key={account.id}><RideTheRacesApp /></ActiveRideProvider></CareerProvider>}

export default App
