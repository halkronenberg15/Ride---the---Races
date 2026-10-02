import type { CuratedWorkout, ExecutableWorkoutSection } from './adaptiveTraining40251.ts'

export type TrainingRideBriefing={
 title:string
 purpose:string
 durationLabel:string
 primaryZone:string
 targetPower:string
 cadence:string
 structure:string
 fueling:string
 jeanOpening:string
}

function powerLabel(workout:CuratedWorkout,ftp:number|null){
 if(!workout.ftpRange||!ftp)return workout.unknownFtpEffort
 return `${Math.round(workout.ftpRange[0]*ftp)}–${Math.round(workout.ftpRange[1]*ftp)} W · ${Math.round(workout.ftpRange[0]*100)}–${Math.round(workout.ftpRange[1]*100)}% FTP`
}

function fuelingLabel(workout:CuratedWorkout){
 if(workout.fueling==='Long ride')return 'Fuel deliberately: carbohydrate and fluids during the ride, then a complete recovery meal.'
 if(workout.fueling==='Quality')return 'Do not start under-fueled. Keep carbohydrate available around the work and recover promptly afterward.'
 if(workout.fueling==='Endurance')return workout.durationMinutes>=60?'Arrive normally fueled. For rides of an hour or more, include fluid/electrolytes and carbohydrate as planned.':'Normal pre-ride meal timing and hydration are enough.'
 return 'Keep the session light. Hydrate normally and prioritize protein across the day.'
}

function structureLabel(sections:ExecutableWorkoutSection[]){
 if(!sections.length)return 'Follow the prescribed workout.'
 return sections.map(section=>`${Math.round(section.durationSeconds/60)} min ${section.title}`).join(' · ')
}

export function buildTrainingRideBriefing(workout:CuratedWorkout,ftp:number|null,sections:ExecutableWorkoutSection[]):TrainingRideBriefing{
 const first=sections[0]
 return {
  title:workout.title,
  purpose:workout.purpose,
  durationLabel:`${workout.durationMinutes} minutes`,
  primaryZone:workout.secondaryZone?`${workout.primaryZone} + ${workout.secondaryZone}`:workout.primaryZone,
  targetPower:powerLabel(workout,ftp),
  cadence:`${workout.cadence[0]}–${workout.cadence[1]} rpm`,
  structure:structureLabel(sections),
  fueling:fuelingLabel(workout),
  jeanOpening:`${workout.title}. ${workout.purpose} ${first?`We start with ${first.title.toLowerCase()}. ${first.jean}`:''}`,
 }
}
