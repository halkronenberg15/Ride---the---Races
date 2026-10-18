import test from 'node:test'
import assert from 'node:assert/strict'
import { buildShoppingList, buildWeeklyMealPlan, RECIPE_CATALOG } from './recipeDiscoveryEngine.ts'
import type { CalendarAssignment } from './alpha4025.ts'

const assignment=(date:string,durationMinutes:number,demandingCycling=false):CalendarAssignment=>({
 id:date,date,day:'Tuesday',type:'CYCLING',title:'Ride',purpose:'Test',camp:'Test',durationMinutes,intensity:demandingCycling?'HARD':'EASY',demandingCycling,environment:'INDOOR',primary:'',shortened:'',indoorAlternative:'',outdoorAlternative:'',recoveryAlternative:'',effort:demandingCycling?'Hard but controlled':'Easy',fueling:{classification:'Easy Zone 2',carbohydrateDemand:'Low',preRide:'',carbsPerHour:null,fluidMlPerHour:null,electrolytes:'',recoveryPriority:'',nextDayWorkload:''},status:'PLANNED'
})

test('weekly meal plan uses saved recipes when available',()=>{
 const saved=RECIPE_CATALOG.slice(0,2).map(item=>item.id)
 const plan=buildWeeklyMealPlan({startDate:'2026-10-19',assignments:[assignment('2026-10-24',90)],savedRecipeIds:saved})
 assert.equal(plan.length,7)
 assert.ok(plan.every(slot=>saved.includes(slot.recipe.id)))
})

test('shopping list aggregates repeated ingredients across the week',()=>{
 const recipe=RECIPE_CATALOG.find(item=>item.id==='rtr-garlic-soy-noodles')!
 const plan=Array.from({length:2},(_,index)=>({date:'2026-10-'+String(19+index),day:'Mon',recipe,reason:'',trainingLabel:''}))
 const list=buildShoppingList(plan)
 const chicken=list.find(item=>item.name==='Chicken breast')!
 assert.equal(chicken.quantity,12)
 assert.equal(chicken.unit,'oz')
 assert.equal(chicken.recipes.length,2)
})
