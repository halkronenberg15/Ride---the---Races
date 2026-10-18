import { useMemo, useState } from 'react'
import { RECIPE_CATALOG, buildShoppingList, buildWeeklyMealPlan, type RecipeCatalogItem } from '../engine/recipeDiscoveryEngine.ts'
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
 const [selectedRecipe,setSelectedRecipe]=useState<RecipeCatalogItem|null>(null)
 const savedIds=useMemo(()=>new Set(career.nutrition.recipePreferences.map(item=>item.recipeId)),[career.nutrition.recipePreferences])
 const assignments=career.alpha4025.trainingPlan?.weeks.flatMap(week=>week.assignments)??[]
 const weekStart=mondayOfWeek()
 const weeklyPlan=useMemo(()=>buildWeeklyMealPlan({startDate:weekStart,assignments,savedRecipeIds:[...savedIds]}),[weekStart,assignments,savedIds])
 const shopping=useMemo(()=>buildShoppingList(weeklyPlan),[weeklyPlan])
 const days=useMemo(()=>Array.from(new Set(weeklyPlan.map(slot=>slot.date))),[weeklyPlan])
 const categories=['For You','Dinner','Quick','High Carb','High Protein','Recovery','Saved']
 const recipes=RECIPE_CATALOG.filter(recipe=>{
  const text=query.trim().toLowerCase()
  if(text&&!recipe.name.toLowerCase().includes(text)&&!recipe.tags.some(tag=>tag.includes(text))&&!recipe.ingredients.some(item=>item.name.toLowerCase().includes(text)))return false
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
   <div><p className="eyebrow">RTR FOOD DISCOVERY</p><h3>Eat food you actually want.</h3><p>Save recipes you like. RtR turns those preferences into a training-aware week, then converts the whole plan into one shopping list.</p></div>
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
      <button type="button" className="recipe-card-art" onClick={()=>setSelectedRecipe(recipe)} aria-label={'View '+recipe.name}><span aria-hidden="true">{recipe.art}</span></button>
      <div className="recipe-card-body">
       <div className="recipe-card-meta"><span>{recipe.mealType}</span><span>{recipe.minutes} min</span></div>
       <button type="button" className="recipe-title-button" onClick={()=>setSelectedRecipe(recipe)}>{recipe.name}</button>
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
   <div className="section-title-row"><div><p className="eyebrow">THIS WEEK</p><h4>Training-aware breakfast, lunch and dinner</h4><p>{savedIds.size?'Saved meals get priority whenever they fit the training day. RtR scales portions instead of labeling food as permanently good or bad.':'Save recipes and RtR will increasingly replace catalog defaults with your favorites.'}</p></div></div>
   <div className="weekly-day-stack">{days.map(date=>{
    const slots=weeklyPlan.filter(slot=>slot.date===date)
    const day=slots[0]
    return <article className="weekly-day-card" key={date}>
     <header><div><strong>{day?.day}</strong><small>{date}</small></div><span>{day?.trainingLabel}</span></header>
     <div className="weekly-day-meals">{slots.map(slot=><button type="button" key={slot.id} className="weekly-meal-row" onClick={()=>setSelectedRecipe(slot.recipe)}>
      <span className="meal-plan-art" aria-hidden="true">{slot.recipe.art}</span>
      <span className="weekly-meal-copy"><small>{slot.mealType}</small><strong>{slot.recipe.name}</strong><span>{slot.adaptedProteinG}g P · {slot.adaptedCarbsG}g C · {slot.adaptedCalories} cal</span><em>{slot.reason}</em></span>
      <span className="portion-chip">{Math.round(slot.portionMultiplier*100)}%</span>
     </button>)}</div>
    </article>
   })}</div>
  </div>:null}

  {tab==='SHOPPING'?<div className="nutrition-shopping-list">
   <div className="section-title-row"><div><p className="eyebrow">SHOPPING LIST</p><h4>One list from the full week</h4><p>Breakfast, lunch and dinner ingredients are aggregated after RtR applies each day’s training-aware portions.</p></div><strong>{shopping.length} items</strong></div>
   <div className="shopping-list-grid">{shopping.map(item=><label key={item.name+'-'+item.unit}><input type="checkbox"/><span><strong>{item.name}</strong><small>{Number(item.quantity.toFixed(2))} {item.unit} · {item.recipes.length} uses</small></span></label>)}</div>
  </div>:null}

  {selectedRecipe?<div className="recipe-detail-backdrop" role="presentation" onClick={()=>setSelectedRecipe(null)}>
   <article className="recipe-detail-panel" role="dialog" aria-modal="true" aria-labelledby="recipe-detail-title" onClick={event=>event.stopPropagation()}>
    <button type="button" className="recipe-detail-close" onClick={()=>setSelectedRecipe(null)} aria-label="Close recipe">×</button>
    <div className="recipe-detail-hero" aria-hidden="true">{selectedRecipe.art}</div>
    <p className="eyebrow">{selectedRecipe.source} RECIPE · {selectedRecipe.minutes} MIN</p>
    <h3 id="recipe-detail-title">{selectedRecipe.name}</h3>
    <div className="recipe-detail-macros"><span><strong>{selectedRecipe.proteinG}g</strong>Protein</span><span><strong>{selectedRecipe.carbsG}g</strong>Carbs</span><span><strong>{selectedRecipe.calories}</strong>Calories</span></div>
    <div className="recipe-tag-row">{selectedRecipe.tags.map(tag=><small key={tag}>{tag}</small>)}</div>
    <section><h4>Base ingredients</h4><ul>{selectedRecipe.ingredients.map(item=><li key={item.name}><span>{item.name}</span><strong>{item.quantity} {item.unit}</strong></li>)}</ul></section>
    <p className="planner-note">RtR treats this as the base recipe. The weekly planner can increase or decrease the portion around the day’s training while preserving the meal itself.</p>
    <div className="recipe-detail-actions"><button type="button" className={savedIds.has(selectedRecipe.id)?'saved':''} onClick={()=>toggleSavedRecipe(selectedRecipe.id)}>{savedIds.has(selectedRecipe.id)?'♥ Saved':'♡ Save this meal'}</button><button type="button" onClick={()=>{if(!savedIds.has(selectedRecipe.id))toggleSavedRecipe(selectedRecipe.id);setTab('PLAN');setSelectedRecipe(null)}}>Use in meal plan</button></div>
   </article>
  </div>:null}
 </section>
}
