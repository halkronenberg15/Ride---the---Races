import type { FuelDayClass } from './fuelingEngine.ts'
import type { PlannedMeal, RecipeCandidate } from './mealPlanningEngine.ts'

export type RoutineFuelSettings={
 defaultDinnerName:string
 hungerFallbackName:string
 dinnerDaysPerWeek:number
}

export type FuelingGuardrail={
 proteinShortfallG:number|null
 carbShortfallG:number|null
 proteinState:'ON TRACK'|'NEEDS PROTEIN'|'NEEDS DATA'
 carbState:'ON TRACK'|'NEEDS CARBS'|'NEEDS DATA'
 headline:string
 tomorrowNote:string
 portionNote:string
}

const matchRecipe=(name:string,recipes:RecipeCandidate[])=>{
 const needle=name.trim().toLowerCase()
 if(!needle)return undefined
 return recipes.find(item=>{
  const candidate=item.name.trim().toLowerCase()
  return candidate===needle||candidate.includes(needle)||needle.includes(candidate)
 })
}

export function buildFuelingGuardrail(args:{
 proteinTargetG:[number,number]|null
 carbTargetG:[number,number]|null
 loggedProteinG:number
 loggedCarbsG:number
 dayClass:FuelDayClass
 tomorrowTrainingMinutes:number
}):FuelingGuardrail{
 const proteinShortfallG=args.proteinTargetG?Math.max(0,Math.round(args.proteinTargetG[0]-args.loggedProteinG)):null
 const carbShortfallG=args.carbTargetG?Math.max(0,Math.round(args.carbTargetG[0]-args.loggedCarbsG)):null
 const proteinState=proteinShortfallG===null?'NEEDS DATA':proteinShortfallG>0?'NEEDS PROTEIN':'ON TRACK'
 const carbState=carbShortfallG===null?'NEEDS DATA':carbShortfallG>0?'NEEDS CARBS':'ON TRACK'
 const needsFuel=(proteinShortfallG??0)>0||(carbShortfallG??0)>0
 const headline=needsFuel?'Fueling floor is not covered yet.':'Fueling floor is covered.'
 const tomorrowNote=args.tomorrowTrainingMinutes>=90
  ? 'Tomorrow has meaningful training. Finish today with carbohydrate on board rather than carrying a deficit into the session.'
  : args.tomorrowTrainingMinutes>0
   ? 'Tomorrow has training. Keep recovery protein steady and do not strip carbohydrate out of dinner.'
   : 'Tomorrow is light enough that dinner can stay routine-sized once today’s minimums are covered.'
 const portionNote=args.dayClass==='HIGH'
  ? 'Keep the routine dinner and use the larger carbohydrate portion.'
  : args.dayClass==='RIDE'
   ? 'Keep the routine dinner and use a normal-to-full carbohydrate portion.'
   : args.dayClass==='STANDARD'
    ? 'Keep the routine dinner and use a normal carbohydrate portion.'
    : 'Keep protein steady. The routine dinner can use the smaller carbohydrate portion unless today is still underfueled.'
 return {proteinShortfallG,carbShortfallG,proteinState,carbState,headline,tomorrowNote,portionNote}
}

export function applyRoutineMeals(args:{
 plan:PlannedMeal[]
 userRecipes:RecipeCandidate[]
 settings:RoutineFuelSettings
 appetite:'LOW'|'NORMAL'|'HUNGRY'
 guardrail:FuelingGuardrail
}):PlannedMeal[]{
 const defaultDinner=matchRecipe(args.settings.defaultDinnerName,args.userRecipes)
 const fallback=matchRecipe(args.settings.hungerFallbackName,args.userRecipes)
 const next=args.plan.map(meal=>{
  if(meal.id!=='dinner'||!defaultDinner)return meal
  return {...meal,label:'Routine dinner',recipe:defaultDinner,rationale:`Routine-first: keep the dinner you are happy repeating. ${args.guardrail.portionNote}`}
 })
 if(args.appetite==='HUNGRY'&&fallback){
  const dinnerIndex=next.findIndex(item=>item.id==='dinner')
  const fallbackMeal:PlannedMeal={id:'routine-hunger-fallback',time:'5:30 PM',label:'Hunger fallback',recipe:fallback,rationale:'You said this is the food you actually want when hunger shows up. Use it instead of improvising, then keep dinner matched to training.',priority:'OPTIONAL'}
  if(dinnerIndex>=0)return [...next.slice(0,dinnerIndex),fallbackMeal,...next.slice(dinnerIndex)]
  return [...next,fallbackMeal]
 }
 return next
}
