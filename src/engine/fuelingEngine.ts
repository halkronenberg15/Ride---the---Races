export type FuelDayClass='RECOVERY'|'STANDARD'|'RIDE'|'HIGH'
export type FuelStatus='NEEDS DATA'|'UNDER TARGET'|'IN RANGE'|'ABOVE RANGE'
export type WeightPhase='NO GOAL'|'WEIGHT LOSS'|'GOAL RANGE'|'BELOW GOAL RANGE'

export type FuelingEngineInput={
 weightKg?:number|null
 goalLowKg?:number|null
 goalHighKg?:number|null
 trainingMinutes:number
 rideMinutes:number
 demanding:boolean
 tomorrowTrainingMinutes?:number
 loggedProteinG?:number
 loggedCarbsG?:number
 loggedCalories?:number
}

export type FuelingEngineResult={
 dayClass:FuelDayClass
 proteinTargetG:[number,number]|null
 carbTargetG:[number,number]|null
 proteinStatus:FuelStatus
 carbStatus:FuelStatus
 weightPhase:WeightPhase
 question:string
 guidance:string[]
}

const status=(value:number|undefined,range:[number,number]|null):FuelStatus=>{
 if(value===undefined||!range)return 'NEEDS DATA'
 if(value<range[0])return 'UNDER TARGET'
 if(value>range[1])return 'ABOVE RANGE'
 return 'IN RANGE'
}

export function evaluateFueling(input:FuelingEngineInput):FuelingEngineResult{
 const {weightKg,goalLowKg,goalHighKg,trainingMinutes,rideMinutes,demanding,tomorrowTrainingMinutes=0}=input
 const dayClass:FuelDayClass=demanding||rideMinutes>=120||trainingMinutes>=150?'HIGH':rideMinutes>=60?'RIDE':trainingMinutes>0?'STANDARD':'RECOVERY'
 const proteinPerKg:[number,number]=[1.6,2.0]
 const carbsPerKg:[number,number]=dayClass==='HIGH'?[4,6]:dayClass==='RIDE'?[3,5]:dayClass==='STANDARD'?[2.5,4]:[2,3]
 const proteinTargetG=weightKg?[Math.round(weightKg*proteinPerKg[0]),Math.round(weightKg*proteinPerKg[1])] as [number,number]:null
 const carbTargetG=weightKg?[Math.round(weightKg*carbsPerKg[0]),Math.round(weightKg*carbsPerKg[1])] as [number,number]:null

 let weightPhase:WeightPhase='NO GOAL'
 if(weightKg&&goalLowKg&&goalHighKg){
  if(weightKg>goalHighKg)weightPhase='WEIGHT LOSS'
  else if(weightKg<goalLowKg)weightPhase='BELOW GOAL RANGE'
  else weightPhase='GOAL RANGE'
 }

 const guidance:string[]=[]
 if(dayClass==='HIGH')guidance.push('High-fuel day: protect pre-, during-, and post-training carbohydrate first.')
 else if(dayClass==='RIDE')guidance.push('Ride-fuel day: keep carbohydrate centered on the session and recovery window.')
 else if(dayClass==='STANDARD')guidance.push('Standard training day: moderate carbohydrate with protein distributed through the day.')
 else guidance.push('Recovery day: protein stays steady while carbohydrate demand can be lower.')

 if(tomorrowTrainingMinutes>=90)guidance.push('Tomorrow carries meaningful workload, so tonight’s recovery meal should restore carbohydrate rather than chase a larger deficit.')

 if(weightPhase==='WEIGHT LOSS')guidance.push('Weight-loss phase is active. Create the deficit away from the workout, not by cutting prescribed ride fuel or recovery protein.')
 if(weightPhase==='GOAL RANGE')guidance.push('Goal-weight range reached. Shift priority from loss to weight maintenance, recovery, and performance.')
 if(weightPhase==='BELOW GOAL RANGE')guidance.push('Current weight is below the configured goal range. Do not pursue further loss without revisiting the target.')

 return {
  dayClass,
  proteinTargetG,
  carbTargetG,
  proteinStatus:status(input.loggedProteinG,proteinTargetG),
  carbStatus:status(input.loggedCarbsG,carbTargetG),
  weightPhase,
  question:'Am I sufficiently fueled for today’s work, tomorrow’s recovery, and meeting my weight-loss goals?',
  guidance,
 }
}
