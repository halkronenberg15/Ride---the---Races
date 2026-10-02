import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMenuHorizon, mealPlanForDay } from './mealPlanningEngine.ts'

test('ride day menu includes protected ride fuel',()=>{
 const plan=mealPlanForDay({dayClass:'RIDE',favorites:['Banana'],avoidFoods:[]})
 assert.ok(plan.some(item=>item.id==='pre-ride'))
 assert.ok(plan.some(item=>item.id==='during'))
})

test('week horizon expands daily plan',()=>{
 const seed=mealPlanForDay({dayClass:'STANDARD'})
 const week=buildMenuHorizon('WEEK',seed)
 assert.equal(week.length,7)
 assert.equal(week[0].meals.length,seed.length)
})
