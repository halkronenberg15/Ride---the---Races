import type { CareerState } from '../types/career.ts'

export function createInitialCareer():CareerState{return {
 schemaVersion:3,onboardingComplete:false,
 rider:{name:'',number:0,nationality:'',team:'Équipe Loriot',archetype:'GC Contender',ftp:0,ftpKnown:false,experience:'Recreational',seasonGoal:'Improve fitness',devices:[]},
 equipment:{activeEquipmentId:null,connectionMethod:'manual-guidance',instances:[]},
 season:{year:2026,currentRace:'Tour de France',currentStage:1,completedStages:[1,2]},races:{tour:{currentStage:1,completedStages:[1,2]},vuelta:{currentStage:1,completedStages:[]}},trainingHistory:[],
 health:{date:new Date().toISOString().slice(0,10),sleepHours:7.5,recoveryScore:82,restingHeartRate:58,hrv:52,fatigue:24,mood:'Good'},rideHistory:[],
 settings:{jeanVoiceEnabled:true,measurementSystem:'imperial',jeanVoiceVolume:1,theme:'dark',reducedMotion:false,dailyReminders:false,preferredRideDurationMode:'RECOMMENDED'},
}}
export const initialCareer=createInitialCareer()
export function equipmentForDevices(devices:CareerState['rider']['devices'],connectionMethod:CareerState['equipment']['connectionMethod']='manual-guidance'):CareerState['equipment']{
 if(devices.includes('Peloton'))return {activeEquipmentId:'peloton-baseline-bike',connectionMethod,instances:[{id:'peloton-baseline-bike',name:'Peloton Bike / Bike+',manufacturer:'Peloton',modelFamily:'Bike',resistanceControl:'manual',powerAvailable:true,cadenceAvailable:true,resistanceAvailable:true,calibrationProfileId:'peloton-bike-manual-reference',calibrationConfidence:'BASELINE'}]}
 if(devices.includes('Wahoo')||devices.includes('Zwift'))return {activeEquipmentId:'smart-equipment',connectionMethod,instances:[{id:'smart-equipment',name:'Smart trainer / smart bike',manufacturer:'Other',modelFamily:'Controllable foundation',resistanceControl:'controllable',powerAvailable:true,cadenceAvailable:true,resistanceAvailable:false,calibrationConfidence:'UNAVAILABLE'}]}
 if(devices.includes('Manual only'))return {activeEquipmentId:'generic-manual-bike',connectionMethod,instances:[{id:'generic-manual-bike',name:'Other manual bike',manufacturer:'Other',modelFamily:'Uncalibrated',resistanceControl:'manual',powerAvailable:false,cadenceAvailable:true,resistanceAvailable:true,calibrationConfidence:'UNAVAILABLE'}]}
 return {activeEquipmentId:null,connectionMethod,instances:[]}
}
export function migrateCareer(saved:Partial<CareerState>):CareerState{const base=createInitialCareer(),legacyTour={currentStage:saved.season?.currentStage??base.races.tour.currentStage,completedStages:saved.season?.completedStages??base.races.tour.completedStages},fallbackEquipment=equipmentForDevices(saved.rider?.devices??[],saved.rider?.connectionMethod??'manual-guidance');return {...base,...saved,schemaVersion:3,onboardingComplete:saved.onboardingComplete??true,rider:{...base.rider,...saved.rider},equipment:{...fallbackEquipment,...saved.equipment,instances:saved.equipment?.instances??fallbackEquipment.instances},season:{...base.season,...saved.season},races:{tour:{...legacyTour,...saved.races?.tour},vuelta:{...base.races.vuelta,...saved.races?.vuelta}},trainingHistory:saved.trainingHistory??[],health:{...base.health,...saved.health},rideHistory:saved.rideHistory??[],settings:{...base.settings,...saved.settings}}}
