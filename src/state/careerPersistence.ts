import type { CareerState } from '../types/career.ts'
import { INITIAL_PELOTON_EQUIPMENT_CALIBRATION } from '../engine/manualBike.ts'
import { createIntroCyclingPlan } from '../engine/introCycling.ts'
import { activeSeasonClosure } from '../engine/release4024.ts'
import { emptyAlpha4025, ensureHalOffSeasonPlan, isHalOffSeasonCareer } from '../engine/alpha4025.ts'

export function createInitialCareer():CareerState{return {
 schemaVersion:6,onboardingComplete:false,
 rider:{name:'',number:0,nationality:'',team:'Équipe Loriot',archetype:'GC Contender',ftp:null,ftpKnown:false,ftpProvenance:'UNKNOWN',experience:'Recreational',seasonGoal:'Improve fitness',devices:[]},
 equipment:{activeEquipmentId:null,connectionMethod:'manual-guidance',instances:[]},
 season:{active:false,year:2026,currentRace:'Tour de France',currentStage:1,completedStages:[1,2],closure:activeSeasonClosure()},pastSeasons:[],favoriteStageRefs:[],races:{tour:{currentStage:1,completedStages:[1,2]},vuelta:{currentStage:1,completedStages:[]}},trainingHistory:[],
 health:{date:new Date().toISOString().slice(0,10),sleepHours:7.5,recoveryScore:82,restingHeartRate:58,hrv:52,fatigue:24,mood:'Good'},rideHistory:[],alpha4020:{calendar:{month:0,scrollY:0},earnedMarkerIds:[]},
 alpha4022:{worldsResults:{},ittSplits:{},raceEvents:{},radioHistory:[],rainbowTitles:[],profileView:{mode:'OVERVIEW',activeRangeId:null,autoConsumedIds:[]}},
 introCycling:{selected:false,answers:null,plan:null,completedRideIds:[],dismissed:false,outdoorChecklistIds:[],requestedNextProgram:null},
 alpha4025:emptyAlpha4025(),
 settings:{jeanVoiceEnabled:true,measurementSystem:'imperial',jeanVoiceVolume:1,theme:'dark',reducedMotion:false,dailyReminders:false,preferredRideDurationMode:'RECOMMENDED'},
}}
export const initialCareer=createInitialCareer()
export function equipmentForDevices(devices:CareerState['rider']['devices'],connectionMethod:CareerState['equipment']['connectionMethod']='manual-guidance'):CareerState['equipment']{
 if(devices.includes('Peloton'))return {activeEquipmentId:'peloton-baseline-bike',connectionMethod,instances:[{id:'peloton-baseline-bike',name:'Peloton Bike / Bike+',manufacturer:'Peloton',modelFamily:'Bike',resistanceControl:'manual',powerAvailable:true,cadenceAvailable:true,resistanceAvailable:true,calibrationProfileId:'peloton-bike-manual-reference',calibrationConfidence:'PERSONALIZED',calibrationSamples:INITIAL_PELOTON_EQUIPMENT_CALIBRATION.map(sample=>({...sample}))}]}
 if(devices.includes('Wahoo')||devices.includes('Zwift'))return {activeEquipmentId:'smart-equipment',connectionMethod,instances:[{id:'smart-equipment',name:'Smart trainer / smart bike',manufacturer:'Other',modelFamily:'Controllable foundation',resistanceControl:'controllable',powerAvailable:true,cadenceAvailable:true,resistanceAvailable:false,calibrationConfidence:'UNAVAILABLE'}]}
 if(devices.includes('Manual only'))return {activeEquipmentId:'generic-manual-bike',connectionMethod,instances:[{id:'generic-manual-bike',name:'Other manual bike',manufacturer:'Other',modelFamily:'Uncalibrated',resistanceControl:'manual',powerAvailable:false,cadenceAvailable:true,resistanceAvailable:true,calibrationConfidence:'UNAVAILABLE'}]}
 return {activeEquipmentId:null,connectionMethod,instances:[]}
}
export function migrateCareer(saved:Partial<CareerState>):CareerState{
 const base=createInitialCareer(),legacyTour={currentStage:saved.season?.currentStage??base.races.tour.currentStage,completedStages:saved.season?.completedStages??base.races.tour.completedStages},fallbackEquipment=equipmentForDevices(saved.rider?.devices??[],saved.rider?.connectionMethod??'manual-guidance')
 const instances=(saved.equipment?.instances??fallbackEquipment.instances).map(instance=>instance.calibrationProfileId==='peloton-bike-manual-reference'&&!instance.calibrationSamples?.length?{...instance,calibrationConfidence:'PERSONALIZED' as const,calibrationSamples:INITIAL_PELOTON_EQUIPMENT_CALIBRATION.map(sample=>({...sample,equipmentId:instance.id}))}:instance)
 const legacyIntro=saved.introCycling as Partial<CareerState['introCycling']>&{outdoorChecklistComplete?:boolean}|undefined,legacyFtp=saved.rider?.ftp,existing=saved.alpha4025
 let alpha4025={...emptyAlpha4025(),...existing,adaptive:{...emptyAlpha4025().adaptive,...existing?.adaptive,selectedAlternatives:{...emptyAlpha4025().adaptive.selectedAlternatives,...existing?.adaptive?.selectedAlternatives}},femmes:{...emptyAlpha4025().femmes,...existing?.femmes}}
 const halCareer=isHalOffSeasonCareer({riderName:saved.rider?.name??'',riderNumber:saved.rider?.number??0,ftp:legacyFtp??null})
 const priorProfile=existing?.trainingPlan?.profileFingerprint??''
 const legacyHalPlan=halCareer&&existing?.trainingPlan?.startDate==='2026-09-21'&&existing.trainingPlan.weeks.length===12&&priorProfile.includes('"weeklyMinutes":240')&&priorProfile.includes('"ftp":206')
 const legacyStrengthSchedule=halCareer&&existing?.trainingPlan?.startDate==='2026-09-21'&&existing.trainingPlan.weeks.length===24&&!priorProfile.includes('"scheduleVersion":2')
 const incompleteHalState=!existing||(existing.intake===null&&existing.developmentProfile===null&&existing.questionnaire===null&&existing.trainingPlan===null&&existing.externalCyclingCompletions?.length===0&&existing.outdoorActivities?.length===0&&existing.adaptive?.zoneDevelopment?.length===0&&existing.adaptive?.difficultyEvaluations?.length===0&&existing.adaptive?.adaptations?.length===0&&existing.offSeasonUnlocked===false)
 if(halCareer&&(incompleteHalState||legacyHalPlan||legacyStrengthSchedule))alpha4025=ensureHalOffSeasonPlan(alpha4025)
 const inferredActive=saved.season?.active??Boolean(saved.rideHistory?.some(ride=>ride.activityType==='RACE_STAGE'))
 return {...base,...saved,schemaVersion:6,onboardingComplete:saved.onboardingComplete??true,rider:{...base.rider,...saved.rider,name:halCareer?'Hal':(saved.rider?.name??base.rider.name).trim().replace(/\s+/g,' '),ftp:halCareer&&legacyFtp===206?229:typeof legacyFtp==='number'&&legacyFtp>0?legacyFtp:null,ftpProvenance:saved.rider?.ftpProvenance??(typeof legacyFtp==='number'&&legacyFtp>0?'RIDER_ENTERED':'UNKNOWN')},equipment:{...fallbackEquipment,...saved.equipment,instances},season:{...base.season,...saved.season,active:inferredActive&&saved.season?.closure?.status!=='ENDED',closure:saved.season?.closure??activeSeasonClosure()},pastSeasons:saved.pastSeasons??[],favoriteStageRefs:saved.favoriteStageRefs??[],races:{tour:{...legacyTour,...saved.races?.tour},vuelta:{...base.races.vuelta,...saved.races?.vuelta}},trainingHistory:saved.trainingHistory??[],health:{...base.health,...saved.health},rideHistory:saved.rideHistory??[],alpha4020:{calendar:{...base.alpha4020.calendar,...saved.alpha4020?.calendar},earnedMarkerIds:saved.alpha4020?.earnedMarkerIds??[]},alpha4022:{...base.alpha4022,...saved.alpha4022,worldsResults:saved.alpha4022?.worldsResults??{},ittSplits:saved.alpha4022?.ittSplits??{},raceEvents:saved.alpha4022?.raceEvents??{},radioHistory:saved.alpha4022?.radioHistory??[],rainbowTitles:saved.alpha4022?.rainbowTitles??[],profileView:{...base.alpha4022.profileView,...saved.alpha4022?.profileView}},introCycling:{...base.introCycling,...legacyIntro,plan:legacyIntro?.answers?createIntroCyclingPlan(legacyIntro.answers):legacyIntro?.plan??null,outdoorChecklistIds:legacyIntro?.outdoorChecklistIds??[]},alpha4025,settings:{...base.settings,...saved.settings}}
}

/** Restores and synchronously persists migrations before the provider's first render. */
export function restoreCareerBeforeRender(storage:Pick<Storage,'getItem'|'setItem'>,storageKey:string,displayName=''):CareerState{
 const raw=storage.getItem(storageKey)
 const restored=raw?migrateCareer(JSON.parse(raw) as Partial<CareerState>):{...createInitialCareer(),rider:{...createInitialCareer().rider,name:displayName}}
 const serialized=JSON.stringify(restored)
 storage.setItem(storageKey,serialized)
 return JSON.parse(serialized) as CareerState
}
