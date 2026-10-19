import type { RemoteCareerProjection } from './careerRemoteProjection.ts'
import { SupabaseRestClient } from './supabaseRestClient.ts'

type RideRow={legacy_source_id:string|null}
type LocalRow={local_id:string|null}
type RecipeRow={recipe_id:string}
type ReadinessRow={date:string}
type PlanRow={local_plan_id:string|null}

const ids=(values:Array<string|null>)=>new Set(values.filter((value):value is string=>Boolean(value)))
const missing=(expected:string[],actual:Set<string>)=>expected.filter(value=>!actual.has(value))

export type NormalizedCareerVerification={
 verified:boolean
 missing:{
  rides:string[]
  nutritionEntries:string[]
  nutritionTemplates:string[]
  trainingJournal:string[]
  readinessDates:string[]
  recipePreferences:string[]
  trainingPlan:string[]
 }
}

export async function verifyNormalizedCareer(client:SupabaseRestClient,athleteId:string,projection:RemoteCareerProjection):Promise<NormalizedCareerVerification>{
 const [rides,nutritionEntries,nutritionTemplates,trainingJournal,readiness,recipePreferences,plans]=await Promise.all([
  client.request<RideRow[]>({path:'rides',query:{select:'legacy_source_id',athlete_id:'eq.'+athleteId}}),
  client.request<LocalRow[]>({path:'nutrition_entries',query:{select:'local_id',athlete_id:'eq.'+athleteId}}),
  client.request<LocalRow[]>({path:'nutrition_templates',query:{select:'local_id',athlete_id:'eq.'+athleteId}}),
  client.request<LocalRow[]>({path:'training_journal',query:{select:'local_id',athlete_id:'eq.'+athleteId}}),
  client.request<ReadinessRow[]>({path:'readiness_entries',query:{select:'date',athlete_id:'eq.'+athleteId}}),
  client.request<RecipeRow[]>({path:'recipe_preferences',query:{select:'recipe_id',athlete_id:'eq.'+athleteId}}),
  client.request<PlanRow[]>({path:'training_plans',query:{select:'local_plan_id',athlete_id:'eq.'+athleteId,is_active:'eq.true'}}),
 ])
 const result={
  rides:missing(projection.rides.map(item=>item.id),ids(rides.map(item=>item.legacy_source_id))),
  nutritionEntries:missing(projection.nutrition.entries.map(item=>item.id),ids(nutritionEntries.map(item=>item.local_id))),
  nutritionTemplates:missing(projection.nutrition.templates.map(item=>item.id),ids(nutritionTemplates.map(item=>item.local_id))),
  trainingJournal:missing(projection.trainingJournal.entries.map(item=>item.id),ids(trainingJournal.map(item=>item.local_id))),
  readinessDates:missing(projection.readiness.history.map(item=>item.date),ids(readiness.map(item=>item.date))),
  recipePreferences:missing(projection.nutrition.recipePreferences.map(item=>item.recipeId),ids(recipePreferences.map(item=>item.recipe_id))),
  trainingPlan:projection.trainingPlan?missing([projection.trainingPlan.id],ids(plans.map(item=>item.local_plan_id))):[],
 }
 return {verified:Object.values(result).every(values=>values.length===0),missing:result}
}
