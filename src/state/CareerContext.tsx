/* eslint-disable react-refresh/only-export-components -- Provider and its typed hook form one public state module. */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CareerState, EditableRideResult, HealthEntry, IntroCyclingAnswers, IntroCyclingPlan, MeasurementSystem, RideMetricEntry } from '../types/career'
import type { Alpha4025State, ExternalCyclingCompletion } from '../engine/alpha4025.ts'
import { equipmentForDevices, initialCareer, restoreCareerBeforeRender } from './careerPersistence.ts'
import { useAuth } from './AuthContext.tsx'
import { careerStorageKey } from '../services/accountStore.ts'
import { closeSeason } from '../engine/release4024.ts'
import { fourWeekPreview, hydrateAdaptive, recordExternalOffSeasonCompletion, recordZoneEvidence } from '../engine/adaptiveTraining40251.ts'

export { initialCareer, migrateCareer } from './careerPersistence.ts'


// Versioned defaults and migration are DOM-free for first-run regression coverage.

type CareerContextValue = {
  career: CareerState
  setCurrentStage: (stage: number) => void
  completeStage: (stage: number) => void
  selectRaceStage: (race: 'tour'|'vuelta', stage:number) => void
  completeRaceStage: (race:'tour'|'vuelta', stage:number) => void
  completeTraining: (workoutId:string,durationMinutes:number) => void
  recordOffSeasonAssignment:(assignmentId:string,workoutId:string,status:'COMPLETED'|'PARTIAL'|'SKIPPED',durationMinutes:number)=>void
  recordExternalOffSeasonCompletion:(activity:ExternalCyclingCompletion)=>void
  completeWorlds: (eventId:'men-elite-itt'|'men-elite-road-race',place?:number,splitIds?:string[]) => void
  addRide: (ride: RideMetricEntry) => void
  updateHealth: (entry: HealthEntry) => void
  updateRider: (rider: Partial<CareerState['rider']>) => void
  completeOnboarding: (rider: CareerState['rider'],intro?:{answers:IntroCyclingAnswers;plan:IntroCyclingPlan}|null) => void
  completeIntroRide:(rideId:string)=>void
  requestNextProgram:(program:'Outdoor Ride Readiness'|'RtR Femmes'|'Standard RtR')=>void
  toggleOutdoorChecklist:(itemId:string)=>void
  endSeason:(ownerEarlyEnd:boolean)=>void
  toggleFavoriteStage:(library:string,stageNumber:number)=>void
  updateRideEntry:(id:string,patch:Partial<EditableRideResult>)=>void
  recordIntroRpe:(value:number)=>void
  updateAlpha4025:(update:(state:Alpha4025State)=>Alpha4025State)=>void
  restartOnboarding: () => void
  setJeanVoiceEnabled: (enabled: boolean) => void
  setMeasurementSystem: (system: MeasurementSystem) => void
  updateSettings: (settings: Partial<CareerState['settings']>) => void
}

const CareerContext = createContext<CareerContextValue | null>(null)

export function CareerProvider({ children }: { children: React.ReactNode }) {
  const {account}=useAuth()
  const storageKey=careerStorageKey(account?.id??'anonymous')
  const [career, setCareer] = useState<CareerState>(() => {
    try {
      return restoreCareerBeforeRender(window.localStorage,storageKey,account?.displayName??'')
    } catch {
      return initialCareer
    }
  })

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(career))
  }, [career,storageKey])

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
    completeRaceStage(race, stage) { setCareer(current=>{const progress=current.races[race]; const completedStages=Array.from(new Set([...progress.completedStages,stage])).sort((a,b)=>a-b); return {...current,races:{...current.races,[race]:{currentStage:Math.min(21,stage+1),completedStages}},season:{...current.season,active:true,currentRace:race==='tour'?'Tour de France':'La Vuelta',currentStage:Math.min(21,stage+1),completedStages}} }) },
    completeTraining(workoutId,durationMinutes) { setCareer(current=>({...current,trainingHistory:[{workoutId,durationMinutes,completedAt:new Date().toISOString(),completed:true},...current.trainingHistory],introCycling:current.introCycling.plan?.rides.some(ride=>ride.id===workoutId)?{...current.introCycling,completedRideIds:Array.from(new Set([...current.introCycling.completedRideIds,workoutId]))}:current.introCycling})) },
    recordOffSeasonAssignment(assignmentId,workoutId,status,durationMinutes){setCareer(current=>{const plan=current.alpha4025.trainingPlan;if(!plan)return current;const now=new Date().toISOString(),updated={...plan,weeks:plan.weeks.map(w=>({...w,assignments:w.assignments.map(a=>a.id===assignmentId?{...a,status,completion:{completedAt:now,durationMinutes},substitution:status==='PARTIAL'?{kind:'SHORTEN' as const,reason:'Ride ended before the planned duration; original assignment preserved.'}:status==='SKIPPED'?{kind:'SKIP' as const,reason:'Rider skipped the assignment; no bonus workload added.'}:a.substitution}:a)}))},adaptive=hydrateAdaptive(current.alpha4025),zoneDevelopment=recordZoneEvidence(adaptive.zoneDevelopment,workoutId,now.slice(0,10),status==='COMPLETED'?'SUCCESS':status==='PARTIAL'?'INCOMPLETE':'STRUGGLED'),adaptationId=`${assignmentId}:${status}:${now.slice(0,10)}`,original=plan.weeks.flatMap(w=>w.assignments).find(a=>a.id===assignmentId),adaptations=status==='COMPLETED'||adaptive.adaptations.some(a=>a.id===adaptationId)?adaptive.adaptations:[...adaptive.adaptations,{id:adaptationId,date:now.slice(0,10),assignmentId,originalWorkoutId:original?.workoutId??workoutId,replacementWorkoutId:workoutId,trigger:status==='PARTIAL'?'Ride ended early':'Session skipped',evidence:[`${durationMinutes} completed minutes`],explanation:status==='PARTIAL'?'The original assignment remains visible with partial completion; no missed work is added later.':'The original assignment remains visible as skipped; no bonus workload is added.',decision:'ACCEPTED' as const}];return {...current,alpha4025:{...current.alpha4025,trainingPlan:updated,adaptive:{...adaptive,zoneDevelopment,adaptations,fourWeekPreview:fourWeekPreview(updated)}}}})},
    recordExternalOffSeasonCompletion(activity){setCareer(current=>({...current,alpha4025:recordExternalOffSeasonCompletion(current.alpha4025,activity)}))},
    completeWorlds(eventId,place,splitIds=[]) { setCareer(current=>({...current,alpha4022:{...current.alpha4022,worldsResults:{...current.alpha4022.worldsResults,[eventId]:{completed:true,...(place?{place}:{})}},ittSplits:{...current.alpha4022.ittSplits,...Object.fromEntries(splitIds.map(id=>[id,1]))},rainbowTitles:place===1&&!current.alpha4022.rainbowTitles.includes(eventId)?[...current.alpha4022.rainbowTitles,eventId]:current.alpha4022.rainbowTitles}})) },
    addRide(ride) {
      setCareer((current) => ({ ...current, rideHistory: [ride, ...current.rideHistory] }))
    },
    updateHealth(entry) {
      setCareer((current) => ({ ...current, health: entry,alpha4025:{...current.alpha4025,readinessEntries:[{date:entry.date,updatedAt:new Date().toISOString(),source:'Manual',sleepHours:entry.sleepHours,externalRecoveryScore:entry.recoveryScore,fatigue:entry.fatigue>=67?'High':entry.fatigue>=34?'Moderate':'Low',soreness:'None',motivation:entry.mood==='Low'?'Low':entry.mood==='Steady'?'Moderate':'High',hydrationConcern:false,illnessOrPain:false,recommendedAdjustment:'Use the authoritative phase-aware readiness projection.'},...current.alpha4025.readinessEntries.filter(item=>item.date!==entry.date)]} }))
    },
    updateRider(rider) {
      setCareer((current) => ({ ...current, rider: { ...current.rider, ...rider } }))
    },
    completeOnboarding(rider,intro) {
      setCareer((current) => ({ ...current, schemaVersion:6, onboardingComplete: true, rider, equipment:equipmentForDevices(rider.devices,rider.connectionMethod),introCycling:intro?{...current.introCycling,selected:true,answers:intro.answers,plan:intro.plan}:current.introCycling }))
    },
    completeIntroRide(rideId){setCareer(current=>({...current,introCycling:{...current.introCycling,completedRideIds:Array.from(new Set([...current.introCycling.completedRideIds,rideId]))}}))},
    requestNextProgram(program){setCareer(current=>({...current,introCycling:{...current.introCycling,requestedNextProgram:program}}))},
    toggleOutdoorChecklist(itemId){setCareer(current=>{const selected=current.introCycling.outdoorChecklistIds.includes(itemId);return {...current,introCycling:{...current.introCycling,outdoorChecklistIds:selected?current.introCycling.outdoorChecklistIds.filter(id=>id!==itemId):[...current.introCycling.outdoorChecklistIds,itemId]}}})},
    endSeason(ownerEarlyEnd){setCareer(current=>{if(!current.season.active||current.season.closure.status==='ENDED')return current;const now=new Date().toISOString(),closure=closeSeason(current.season.closure,{now,finalStageCompleted:Math.max(0,...current.season.completedStages),ownerEarlyEnd,results:{races:current.races,rideIds:current.rideHistory.filter(ride=>ride.activityType==='RACE_STAGE').map(ride=>ride.id)}});const official=current.rideHistory.filter(ride=>ride.activityType==='RACE_STAGE'),archived={year:current.season.year,race:current.season.currentRace,closure,stages:Array.from({length:21},(_,index)=>{const stageNumber=index+1,ride=official.find(item=>item.stageNumber===stageNumber);return {stageNumber,rideId:ride?.id,completed:current.season.completedStages.includes(stageNumber),result:ride?.terminatedEarly?'Ended early':ride?'Completed':undefined}})},totalMinutes=official.reduce((sum,r)=>sum+r.durationMinutes,0),totalDistance=official.reduce((sum,r)=>sum+r.distanceKm,0);return {...current,season:{...current.season,active:false,closure},pastSeasons:[...current.pastSeasons,archived],alpha4025:{...current.alpha4025,offSeasonUnlocked:true,seasonReview:{generatedAt:now,availableMetrics:{FTP:current.rider.ftp??'Unavailable','Ride count':official.length,'Total duration':`${totalMinutes} minutes`,'Total distance':`${Math.round(totalDistance*10)/10} km`},unavailableMetrics:['FTP trend','Watts per kilogram','Normalized power','Fueling tolerance'].filter(metric=>metric!=='FTP trend'||current.rider.ftp===null),improvements:official.length?['Season consistency recorded from completed account activities.']:['No completed official rides available for an improvement comparison.'],strengths:[`${current.rider.archetype} development profile`],opportunities:['Outdoor endurance','Recovery consistency','Sustained-power durability'],recoveryConcerns:[],offSeasonEmphasis:['Aerobic base','Strength and torque','Outdoor pacing']}}}})},
    toggleFavoriteStage(library,stageNumber){setCareer(current=>{const exists=current.favoriteStageRefs.some(item=>item.library===library&&item.stageNumber===stageNumber);return {...current,favoriteStageRefs:exists?current.favoriteStageRefs.filter(item=>item.library!==library||item.stageNumber!==stageNumber):[...current.favoriteStageRefs,{library,stageNumber}]}})},
    updateRideEntry(id,patch){setCareer(current=>{const source=current.rideHistory.find(ride=>ride.id===id),updatedAt=new Date().toISOString(),original=source?.originalUserEntry??(source?{durationMinutes:source.durationMinutes,actualEngineDurationSeconds:source.actualEngineDurationSeconds,totalOutputKj:source.totalOutputKj,averagePower:source.averagePower,peakPower:source.peakPower,averageCadence:source.averageCadence,averageResistance:source.averageResistance,averageHeartRate:source.averageHeartRate,maximumHeartRate:source.maximumHeartRate,distanceKm:source.distanceKm,calories:source.calories,striveScore:source.striveScore,rpe:source.rpe,notes:source.notes,equipmentId:source.equipmentId}:undefined);return {...current,rider:source?.activityType==='CALIBRATION'&&patch.rpe?{...current.rider,ftpProvenance:'INTRO_EFFORT_BASELINE',introEffortBaseline:{rpe:patch.rpe,cadence:70,load:'Rider-recorded conservative calibration steps',completedSteps:2,recordedAt:updatedAt,ruleVersion:'alpha4024.2'}}:current.rider,rideHistory:current.rideHistory.map(ride=>ride.id===id?{...ride,originalUserEntry:original,correctedEntry:{...ride.correctedEntry,...patch},updatedAt}:ride)}})},
    recordIntroRpe(value){setCareer(current=>{const prior=current.rider.introEffortBaseline?.checkpointRpe??[],checkpointRpe=[...prior,Math.max(1,Math.min(10,Math.round(value)))].slice(-2),rpe=checkpointRpe.reduce((sum,item)=>sum+item,0)/checkpointRpe.length;return {...current,rider:{...current.rider,ftpProvenance:'INTRO_EFFORT_BASELINE',introEffortBaseline:{rpe,cadence:70,load:'Rider-recorded calibration checkpoints',completedSteps:checkpointRpe.length,checkpointRpe,recordedAt:new Date().toISOString(),ruleVersion:'alpha4024.2'}}}})},
    updateAlpha4025(update){setCareer(current=>({...current,alpha4025:update(current.alpha4025)}))},
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
