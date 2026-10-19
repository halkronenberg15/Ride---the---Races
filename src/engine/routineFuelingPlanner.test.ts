import test from 'node:test'
import assert from 'node:assert/strict'
import { applyRoutineMeals, buildFuelingGuardrail } from './routineFuelingPlanner.ts'
import type { PlannedMeal, RecipeCandidate } from './mealPlanningEngine.ts'

const recipes:RecipeCandidate[]=[
 {id:'pasta',name:'Beef red sauce + angel hair pasta',mealType:'Dinner',proteinG:35,carbsG:75,tags:['user'],source:'USER'},
 {id:'bologna',name:'Beef bologna on rye',mealType:'Lunch',proteinG:18,carbsG:30,tags:['user'],source:'USER'},
]

test('guardrail exposes protein and carb gaps against the fueling floor',()=>{
 const result=buildFuelingGuardrail({proteinTargetG:[160,200],carbTargetG:[300,500],loggedProteinG:120,loggedCarbsG:210,dayClass:'RIDE',tomorrowTrainingMinutes:90})
 assert.equal(result.proteinShortfallG,40)
 assert.equal(result.carbShortfallG,90)
 assert.equal(result.proteinState,'NEEDS PROTEIN')
 assert.equal(result.carbState,'NEEDS CARBS')
 assert.match(result.tomorrowNote,/meaningful training/)
})

test('routine planner keeps repetitive dinner and adds the preferred hunger fallback',()=>{
 const seed:PlannedMeal[]=[{id:'dinner',time:'7:00 PM',label:'Dinner',recipe:{id:'other',name:'Something new',mealType:'Dinner',tags:[],source:'RTR'},rationale:'',priority:'CORE'}]
 const guardrail=buildFuelingGuardrail({proteinTargetG:[150,190],carbTargetG:[250,400],loggedProteinG:100,loggedCarbsG:150,dayClass:'STANDARD',tomorrowTrainingMinutes:0})
 const plan=applyRoutineMeals({plan:seed,userRecipes:recipes,settings:{defaultDinnerName:'Beef red sauce + angel hair pasta',hungerFallbackName:'Beef bologna on rye',dinnerDaysPerWeek:5},appetite:'HUNGRY',guardrail})
 assert.equal(plan.find(item=>item.id==='dinner')?.recipe.id,'pasta')
 assert.equal(plan.find(item=>item.id==='routine-hunger-fallback')?.recipe.id,'bologna')
})
