import type { CareerState } from '../types/career.ts'
import { missionFranceSnapshot } from './missionFrance2028.ts'

export type JimmyCoachContext={
  riderName:string
  ftp:number|null
  weightKg?:number
  healthDate:string
  recoveryScore:number
  fatigue:number
  mood:string
  recentRideCount:number
  recentMinutes:number
  longestRideMinutes:number
  offSeasonUnlocked:boolean
  hasTrainingPlan:boolean
  nutritionEntriesToday:number
}

const localToday=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}

export function jimmyCoachContext(career:CareerState):JimmyCoachContext{
 const mission=missionFranceSnapshot(career)
 return {
  riderName:career.rider.name||'Rider',
  ftp:career.rider.ftp,
  weightKg:career.rider.weightKg,
  healthDate:career.health.date,
  recoveryScore:career.health.recoveryScore,
  fatigue:career.health.fatigue,
  mood:career.health.mood,
  recentRideCount:mission.rides7,
  recentMinutes:mission.minutes7,
  longestRideMinutes:mission.longestMinutes,
  offSeasonUnlocked:career.alpha4025.offSeasonUnlocked,
  hasTrainingPlan:Boolean(career.alpha4025.trainingPlan),
  nutritionEntriesToday:career.nutrition.entries.filter(entry=>entry.date===localToday()).length,
 }
}

export function jimmyCoachOpeningLine(career:CareerState){
 const ctx=jimmyCoachContext(career)
 if(ctx.recentRideCount===0)return `Jimmy: I'm in the team car, ${ctx.riderName}. Let's get today's training, recovery and fueling lined up.`
 if(ctx.fatigue>=67)return `Jimmy: You've got ${ctx.recentMinutes} minutes in the last 7 days and fatigue is running high. Let's protect the work you've already banked.`
 if(ctx.recoveryScore>=75)return `Jimmy: Recovery looks solid today. We can train with purpose, but we're still building for France, not chasing one heroic session.`
 return `Jimmy: I have your recent riding, recovery and nutrition context. Tell me what you need and we'll make the next decision fit Mission France.`
}
