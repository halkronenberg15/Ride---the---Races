import { useMemo, useState } from 'react'
import { RECIPE_CATALOG, buildShoppingList, buildWeeklyMealPlan } from '../engine/recipeDiscoveryEngine.ts'
import { useCareer } from '../state/CareerContext.tsx'

type Tab='DISCOVER'|'PLAN'|'SHOPPING'

const mondayOfWeek=(date=new Date())=>{
 const copy=new Date(date)
 const day=copy.getDay()
 const diff=day===0?-6:1-day
 copy.setDate(copy.getDate()+diff)
 return [copy.getFullYear(),String(copy.getMonth()+1).padStart(2,'0'),String(copy.getDate()).padStart(2,'0')].join('-')
}

export default function NutritionDiscoveryPlanner(){
 const {career,toggleSavedRecipe,recordRecipeCooked}=useCareer()
 const [tab,setTab]=useState<Tab>('DISCOVER')
 const [query,setQuery]=useState('')
 const [category,setCategory]=useState('For You')
 const savedIds=useMemo(()=>new Set(career.nutrition.recipePreferences.map(item=>item.recipeId)),[career.nutrition.recipePreferences])
 const assignments=career.alpha4025.trainingPlan?.weeks.flatMap(week=>week.assignments)??[]
 const weekStart=mondayOfWeek()
 const weeklyPlan=useMemo(()=>buildWeeklyMealPlan({startDate:weekStart,assignments,savedRecipeIds:[...savedIds]}),[weekStart,assignments,savedIds])
 const shopping=useMemo(()=>buildShoppingList(weeklyPlan),[weeklyPlan])
 const categories=['For You','Dinner','Quick','High Carb','High Protein','Recovery','Saved']
 const recipes=RECIPE_CATALOG.filter(recipe=>{
  const text=query.trim().toLowerCase()
  if(text&&!recipe.name.toLowerCase().includes(text)&&!recipe.tags.some(tag=>tag.includes(text)))return false
  if(category==='Saved')return savedIds.has(recipe.id)
  if(category==='Dinner')return recipe.mealType==='Dinner'
  if(category==='Quick')return recipe.minutes<=30
  if(category==='High Carb')return recipe.carbsG>=60
  if(category==='High Protein')return recipe.proteinG>=35
  if(category==='Recovery')return recipe.tags.includes('recovery')
  return true
 })

 return <section className="nutrition-discovery-shell">
  <header className="nutrition-discovery-header">
   <div><p className="eyebrow">RTR FOOD DISCOVERY</p><h3>Eat food you actually want.</h3><p>Save recipes you like. RtR uses those preferences to build the week around your training, then turns the plan into a shopping list.</p></div>
   <div className="nutrition-discovery-tabs" role="tablist" aria-label="Nutrition planning views">
    <button type="button" role="tab" aria-selected={tab==='DISCOVER'} className={tab==='DISCOVER'?'active':''} onClick={()=>setTab('DISCOVER')}>Discover</button>
    <button type="button" role="tab" aria-selected={tab==='PLAN'} className={tab==='PLAN'?'active':''} onClick={()=>setTab('PLAN')}>Meal Plan</button>
    <button type="button" role="tab" aria-selected={tab==='SHOPPING'} className={tab==='SHOPPING'?'active':''} onClick={()=>setTab('SHOPPING')}>Shopping</button>
   </div>
  </header>

  {tab==='DISCOVER'?<>
   <label className="recipe-search"><span className="sr-only">Search recipes</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search recipes, ingredients or styles" /></label>
   <div className="recipe-category-row" aria-label="Recipe categories">{categories.map(item=><button type="button" key={item} className={category===item?'active':''} onClick={()=>setCategory(item)}>{item}</button>)}</div>
   <div className="recipe-card-rail">
    {recipes.map(recipe=>{
     const saved=savedIds.has(recipe.id)
     return <article className="recipe-discovery-card" key={recipe.id}>
      <div className="recipe-card-art" aria-hidden="true"><span>{recipe.art}</span></div>
      <div className="recipe-card-body">
       <div className="recipe-card-meta"><span>{recipe.mealType}</span><span>{recipe.minutes} min</span></div>
       <h4>{recipe.name}</h4>
       <p>{recipe.proteinG}g protein · {recipe.carbsG}g carbs · {recipe.calories} cal</p>
       <div className="recipe-tag-row">{recipe.tags.slice(0,3).map(tag=><small key={tag}>{tag}</small>)}</div>
       <div className="recipe-card-actions">
        <button type="button" className={saved?'saved':''} onClick={()=>toggleSavedRecipe(recipe.id)}>{saved?'♥ Saved':'♡ Save'}</button>
        {saved?<button type="button" onClick={()=>recordRecipeCooked(recipe.id)}>Cooked it</button>:null}
       </div>
      </div>
     </article>
    })}
   </div>
   {recipes.length===0?<p className="planner-note">No recipes match that filter yet.</p>:null}
  </>:null}

  {tab==='PLAN'?<div className="weekly-meal-plan">
   <div className="section-title-row"><div><p className="eyebrow">THIS WEEK</p><h4>Training-aware dinner plan</h4><p>{savedIds.size?'Built primarily from '+savedIds.size+' saved recipe'+(savedIds.size===1?'':'s')+'.':'Save recipes and RtR will increasingly replace catalog defaults with your favorites.'}</p></div></div>
   <div className="weekly-meal-grid">{weeklyPlan.map(slot=><article key={slot.date}>
    <header><strong>{slot.day}</strong><small>{slot.date}</small></header>
    <span className="meal-plan-art" aria-hidden="true">{slot.recipe.art}</span>
    <h4>{slot.recipe.name}</h4>
    <small>{slot.trainingLabel}</small>
    <p>{slot.reason}</p>
   </article>)}</div>
  </div>:null}

  {tab==='SHOPPING'?<div className="nutrition-shopping-list">
   <div className="section-title-row"><div><p className="eyebrow">SHOPPING LIST</p><h4>One list from the whole meal plan</h4><p>Quantities are aggregated across the seven planned dinners so repeated ingredients only appear once.</p></div><strong>{shopping.length} items</strong></div>
   <div className="shopping-list-grid">{shopping.map(item=><label key={item.name+'-'+item.unit}><input type="checkbox"/><span><strong>{item.name}</strong><small>{Number(item.quantity.toFixed(2))} {item.unit}</small></span></label>)}</div>
  </div>:null}
 </section>
}
