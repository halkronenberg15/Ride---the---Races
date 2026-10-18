import type { CalendarAssignment } from './alpha4025.ts'
import type { FuelDayClass } from './fuelingEngine.ts'

export type FuelWindow={
  label:string
  timing:string
  target:string
  note:string
}

export type RideFuelPrescription={
  dayClass:FuelDayClass
  rideMinutes:number
  demanding:boolean
  carbsPerHour:[number,number]
  rideCarbsTotal:[number,number]
  fluidOzPerHour:[number,number]
  sodiumNote:string
  windows:FuelWindow[]
  recoveryNote:string
  tomorrowNote:string
}

const round5=(value:number)=>Math.max(0,Math.round(value/5)*5)

export function rideFuelPrescription(args:{
  assignments:CalendarAssignment[]
  tomorrowAssignments?:CalendarAssignment[]
  dayClass:FuelDayClass
}):RideFuelPrescription{
  const rides=args.assignments.filter(item=>item.type==='CYCLING'||item.type==='ASSESSMENT')
  const rideMinutes=rides.reduce((sum,item)=>sum+Math.max(0,item.durationMinutes),0)
  const demanding=rides.some(item=>item.demandingCycling||item.intensity==='HARD')
  const hours=Math.max(0,rideMinutes/60)
  const carbsPerHour:[number,number]=rideMinutes>=120?[50,70]:demanding||rideMinutes>=75?[40,60]:rideMinutes>=45?[20,40]:[0,25]
  const rideCarbsTotal:[number,number]=[round5(carbsPerHour[0]*hours),round5(carbsPerHour[1]*hours)]
  const fluidOzPerHour:[number,number]=rideMinutes>=45?[16,24]:[12,20]
  const tomorrowMinutes=(args.tomorrowAssignments??[]).reduce((sum,item)=>sum+Math.max(0,item.durationMinutes),0)
  const windows:FuelWindow[]=[]

  if(rideMinutes===0){
    windows.push({label:'No ride fuel required',timing:'Today',target:'Normal meal timing',note:'Keep protein steady and use carbohydrate to support recovery and tomorrow rather than forcing a training-day intake.'})
  }else{
    windows.push({
      label:'Pre-ride',
      timing:'30–90 min before',
      target:rideMinutes>=90?'30–60 g carbohydrate':'20–40 g carbohydrate',
      note:'Use familiar, low-friction food. Protect this window even when appetite is quiet.'
    })
    windows.push({
      label:'During ride',
      timing:'Start early, then repeat',
      target:`${carbsPerHour[0]}–${carbsPerHour[1]} g carbohydrate/hour`,
      note:rideMinutes>=90?'Begin within the first 20–30 minutes instead of waiting for hunger.':'A small early carbohydrate dose is enough for this duration if the ride stays easy.'
    })
    windows.push({
      label:'Fluid + electrolytes',
      timing:'Across the ride',
      target:`${fluidOzPerHour[0]}–${fluidOzPerHour[1]} oz/hour`,
      note:'Adjust upward for heat and heavy sweating. Sodium should come from the drink/fuel strategy rather than plain water alone on longer hot rides.'
    })
    windows.push({
      label:'Post-ride',
      timing:'Within ~60 min',
      target:'Protein + carbohydrate + fluid',
      note:'Replace what the ride cost before chasing a calorie deficit.'
    })
  }

  return {
    dayClass:args.dayClass,
    rideMinutes,
    demanding,
    carbsPerHour,
    rideCarbsTotal,
    fluidOzPerHour,
    sodiumNote:rideMinutes>=75?'Use an electrolyte strategy matched to sweat and conditions.':'Electrolytes are optional unless heat/sweat demand is high.',
    windows,
    recoveryNote:rideMinutes>=90?'Make the next full meal a real recovery meal, not a snack-sized compromise.':'Keep protein distributed through the day and refill carbohydrate in proportion to the work.',
    tomorrowNote:tomorrowMinutes>=90?`Tomorrow carries about ${tomorrowMinutes} planned minutes, so dinner should restore carbohydrate and fluids.`:'Tomorrow is not a major load day, so recovery can stay proportional to today.'
  }
}
