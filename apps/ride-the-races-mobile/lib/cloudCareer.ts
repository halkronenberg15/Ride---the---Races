import { supabase } from './supabase'

export type CloudCareerSnapshot={
  rider:{name:string;ftp:number|null;weightKg?:number;archetype?:string;seasonGoal?:string}
  rideHistory:Array<{id:string;date:string;durationMinutes:number;distanceKm:number;averagePower?:number;source?:string;workoutId?:string;offSeasonAssignmentId?:string}>
  trainingHistory:Array<{workoutId:string;durationMinutes:number;completedAt:string;completed:true}>
  races?:{tour?:{completedStages:number[]};vuelta?:{completedStages:number[]}}
  season?:{active:boolean;currentRace:string;currentStage:number;completedStages:number[]}
  alpha4025?:{
    trainingPlan?:{
      startDate?:string
      weeks:Array<{
        weekNumber?:number
        recoveryWeek?:boolean
        assignments:Array<{
          id:string
          date:string
          type:string
          title?:string
          status?:string
          durationMinutes?:number
          workoutId?:string
          environment?:string
          demandingCycling?:boolean
        }>
      }>
    }|null
  }
  settings?:{measurementSystem?:'imperial'|'metric'}
}

export async function loadLatestCloudCareer(athleteId:string):Promise<CloudCareerSnapshot|null>{
  const {data,error}=await supabase
    .from('legacy_profile_imports')
    .select('raw_profile')
    .eq('athlete_id',athleteId)
    .order('imported_at',{ascending:false})
    .limit(1)
    .maybeSingle()
  if(error)throw error
  const raw=data?.raw_profile as {career?:CloudCareerSnapshot}|undefined
  return raw?.career??null
}

export async function loadCloudRideCount(athleteId:string){
  const {count,error}=await supabase
    .from('rides')
    .select('ride_id',{count:'exact',head:true})
    .eq('athlete_id',athleteId)
  if(error)throw error
  return count??0
}
