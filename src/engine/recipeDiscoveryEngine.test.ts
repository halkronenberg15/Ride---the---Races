import test from 'node:test'
import assert from 'node:assert/strict'
import { buildShoppingList, buildWeeklyMealPlan, RECIPE_CATALOG } from './recipeDiscoveryEngine.ts'
import type { CalendarAssignment } from './alpha4025.ts'

const assignment=(date:string,durationMinutes:number,demandingCycling=false):CalendarAssignment=>({
 id:date,date,day:'Tuesday',type:'CYCLING',title:'Ride',purpose:'Test',camp:'Test',durationMinutes,intensity:demandingCycling?'HARD':'EASY',demandingCycling,environment:'INDOOR',primary:'',shortened:'',indoorAlternative:'',outdoorAlternative:'',recoveryAlternative:'',effort:demandingCycling?'Hard but controlled':'Easy',fueling:{classification:'Easy Zone 2',carbohydrateDemand:'Low',preRide:'',carbsPerHour:null,fluidMlPerHour:null,electrolytes:'',recoveryPriority:'',nextDayWorkload:''},status:'PLANNED'
})

test('weekly meal plan builds breakfast lunch and dinner for seven days',()=>{
 const saved=RECIPE_CATALOG.filter(item=>item.mealType==='Dinner').slice(0,2).map(item=>item.id)
 const plan=buildWeeklyMealPlan({startDate:'2026-10-19',assignments:[assignment('2026-10-24',90)],savedRecipeIds:saved})
 assert.equal(plan.length,21)
 assert.equal(plan.filter(slot=>slot.mealType==='Breakfast').length,7)
 assert.equal(plan.filter(slot=>slot.mealType==='Lunch').length,7)
 assert.equal(plan.filter(slot=>slot.mealType==='Dinner').length,7)
 assert.ok(plan.filter(slot=>slot.mealType==='Dinner').some(slot=>saved.includes(slot.recipe.id)))
})

test('longer rides increase meal portions and shopping quantities',()=>{
 const plan=buildWeeklyMealPlan({startDate:'2026-10-19',assignments:[assignment('2026-10-24',120)],savedRecipeIds:[]})
 const longDinner=plan.find(slot=>slot.date==='2026-10-24'&&slot.mealType==='Dinner')!
 const restDinner=plan.find(slot=>slot.date==='2026-10-19'&&slot.mealType==='Dinner')!
 assert.ok(longDinner.portionMultiplier>restDinner.portionMultiplier)
 assert.ok(longDinner.adaptedCarbsG>longDinner.recipe.carbsG)
 const shopping=buildShoppingList(plan)
 assert.ok(shopping.length>0)
})

test('shopping list aggregates repeated ingredients across planned meals',()=>{
 const recipe=RECIPE_CATALOG.find(item=>item.id==='rtr-garlic-soy-noodles')!
 const plan=[0,1].map(index=>({id:'x'+index,date:'2026-10-'+String(19+index),day:'Mon',mealType:'Dinner' as const,recipe,reason:'',trainingLabel:'',portionMultiplier:1,adaptedProteinG:recipe.proteinG,adaptedCarbsG:recipe.carbsG,adaptedCalories:recipe.calories}))
 const list=buildShoppingList(plan)
 const chicken=list.find(item=>item.name==='Chicken breast')!
 assert.equal(chicken.quantity,12)
 assert.equal(chicken.unit,'oz')
 assert.equal(chicken.recipes.length,2)
})
