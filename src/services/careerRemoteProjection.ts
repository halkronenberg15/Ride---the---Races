import type { CareerState } from '../types/career.ts'

export type RemoteCareerProjection={
 careerSnapshot:CareerState
 riderState:{
  schemaVersion:number
  rider:CareerState['rider']
  equipment:CareerState['equipment']
  season:CareerState['season']
  settings:CareerState['settings']
 }
 trainingPlan:CareerState['alpha4025']['trainingPlan']
 trainingJournal:CareerState['trainingJournal']
 rides:CareerState['rideHistory']
 nutrition:{
  entries:CareerState['nutrition']['entries']
  templates:CareerState['nutrition']['mealTemplates']
  recipePreferences:CareerState['nutrition']['recipePreferences']
  profile:{
   goalWeightLowKg?:number
   goalWeightHighKg?:number
   favoriteFoods?:string[]
   avoidFoods?:string[]
  }
 }
 readiness:{
  current:CareerState['health']
  history:CareerState['alpha4025']['readinessEntries']
 }
}

export function projectCareerForRemote(career:CareerState):RemoteCareerProjection{
 return {
  careerSnapshot:career,
  riderState:{
   schemaVersion:career.schemaVersion,
   rider:career.rider,
   equipment:career.equipment,
   season:career.season,
   settings:career.settings,
  },
  trainingPlan:career.alpha4025.trainingPlan,
  trainingJournal:career.trainingJournal,
  rides:career.rideHistory,
  nutrition:{
   entries:career.nutrition.entries,
   templates:career.nutrition.mealTemplates,
   recipePreferences:career.nutrition.recipePreferences,
   profile:{
    goalWeightLowKg:career.nutrition.goalWeightLowKg,
    goalWeightHighKg:career.nutrition.goalWeightHighKg,
    favoriteFoods:career.nutrition.favoriteFoods,
    avoidFoods:career.nutrition.avoidFoods,
   },
  },
  readiness:{
   current:career.health,
   history:career.alpha4025.readinessEntries,
  },
 }
}

export function remoteProjectionCounts(projection:RemoteCareerProjection){
 return {
  rides:projection.rides.length,
  nutritionEntries:projection.nutrition.entries.length,
  nutritionTemplates:projection.nutrition.templates.length,
  readinessEntries:projection.readiness.history.length,
  trainingJournalEntries:projection.trainingJournal.entries.length,
 }
}
