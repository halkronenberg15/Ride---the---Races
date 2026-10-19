import type { RemoteCareerProjection } from './careerRemoteProjection.ts'
import { SupabaseRestClient } from './supabaseRestClient.ts'

const compact=<T extends Record<string,unknown>>(row:T)=>Object.fromEntries(Object.entries(row).filter(([,value])=>value!==undefined)) as T

async function upsertRows(client:SupabaseRestClient,path:string,onConflict:string,rows:Record<string,unknown>[]){
 if(rows.length===0)return
 await client.request<void>({
  method:'POST',
  path,
  query:{on_conflict:onConflict},
  prefer:'resolution=merge-duplicates,return=minimal',
  body:rows.map(compact),
 })
}

export async function writeNormalizedCareer(client:SupabaseRestClient,athleteId:string,projection:RemoteCareerProjection){
 const career=projection.careerSnapshot

 await client.request<void>({
  method:'PATCH',
  path:'athlete_profiles',
  query:{athlete_id:'eq.'+athleteId},
  prefer:'return=minimal',
  body:compact({
   display_name:career.rider.name,
   ftp_watts:career.rider.ftp??undefined,
   weight_kg:career.rider.weightKg,
   preferred_units:career.settings.measurementSystem,
   rider_number:career.rider.number||undefined,
   height_cm:career.rider.heightCm,
   archetype:career.rider.archetype,
   season_goal:career.rider.seasonGoal,
   updated_at:new Date().toISOString(),
  }),
 })

 await upsertRows(client,'rides','athlete_id,legacy_source_id',career.rideHistory.map(ride=>({
  athlete_id:athleteId,
  legacy_source_id:ride.id,
  source:ride.source,
  started_at:ride.date,
  completed_at:ride.date,
  duration_seconds:Math.max(0,Math.round((ride.actualEngineDurationSeconds??ride.durationMinutes*60))),
  distance_meters:ride.distanceKm*1000,
  elevation_meters:ride.elevationM,
  average_power_watts:ride.averagePower,
  average_heart_rate_bpm:ride.averageHeartRate,
  average_cadence_rpm:ride.averageCadence,
  energy_kj:ride.totalOutputKj,
  calories:ride.calories,
  ftp_watts:ride.ftp,
  workout_id:ride.workoutId,
  assignment_id:ride.offSeasonAssignmentId,
  race_id:ride.race,
  stage_number:ride.stageNumber,
  notes:ride.notes,
  updated_at:ride.updatedAt??ride.date,
  legacy_source_payload:ride,
 })))

 await upsertRows(client,'nutrition_entries','athlete_id,local_id',career.nutrition.entries.map(entry=>({
  athlete_id:athleteId,
  local_id:entry.id,
  logged_at:entry.loggedAt,
  date:entry.date,
  meal_type:entry.mealType,
  name:entry.name,
  calories:entry.calories,
  protein_g:entry.proteinG,
  carbs_g:entry.carbsG,
  fluid_oz:entry.fluidOz,
  metadata:{notes:entry.notes,templateId:entry.templateId},
 })))

 await upsertRows(client,'nutrition_templates','athlete_id,local_id',career.nutrition.mealTemplates.map(template=>({
  athlete_id:athleteId,
  local_id:template.id,
  name:template.name,
  meal_type:template.mealType,
  calories:template.calories,
  protein_g:template.proteinG,
  carbs_g:template.carbsG,
  fluid_oz:template.fluidOz,
  aliases:template.aliases??[],
  times_used:template.timesUsed,
  last_used_at:template.lastUsedAt||undefined,
 })))

 await upsertRows(client,'training_journal','athlete_id,local_id',career.trainingJournal.entries.map(entry=>({
  athlete_id:athleteId,
  local_id:entry.id,
  date:entry.date,
  entry,
  updated_at:entry.updatedAt,
 })))

 const plan=career.alpha4025.trainingPlan
 if(plan){
  const assignments=plan.weeks.flatMap(week=>week.assignments)
  const endDate=assignments.at(-1)?.date
  await upsertRows(client,'training_plans','athlete_id,local_plan_id',[{
   athlete_id:athleteId,
   local_plan_id:plan.id,
   start_date:plan.startDate,
   end_date:endDate,
   version:1,
   is_active:true,
   plan,
   updated_at:new Date().toISOString(),
  }])
 }

 await upsertRows(client,'readiness_entries','athlete_id,date',career.alpha4025.readinessEntries.map(entry=>({
  athlete_id:athleteId,
  date:entry.date,
  entry,
 })))

 await upsertRows(client,'recipe_preferences','athlete_id,recipe_id',career.nutrition.recipePreferences.map(pref=>({
  athlete_id:athleteId,
  recipe_id:pref.recipeId,
  saved_at:pref.savedAt,
  times_planned:pref.timesPlanned,
  times_cooked:pref.timesCooked,
  rating:pref.rating,
 })))
}
