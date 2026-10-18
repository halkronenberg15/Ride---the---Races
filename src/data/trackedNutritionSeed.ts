import type { NutritionMealTemplate } from '../types/career.ts'

const lastUsedAt='2026-10-18T12:00:00-04:00'

export const TRACKED_MEAL_SEED:NutritionMealTemplate[]=[
 {id:'seed-fairlife',name:'Fairlife Nutrition Plan shake',mealType:'Recovery',proteinG:30,timesUsed:1,lastUsedAt,aliases:['Fairlife','protein shake']},
 {id:'seed-tart-cherry',name:'Tart cherry concentrate + sparkling water + glycine',mealType:'Recovery',fluidOz:12,timesUsed:1,lastUsedAt,aliases:['tart cherry night drink','tart cherry + glycine']},
 {id:'seed-yogurt-bowl',name:'Yogurt bowl with granola and blueberries',mealType:'Snack',timesUsed:1,lastUsedAt,aliases:['170g yogurt + granola + blueberries','yogurt bowl']},
 {id:'seed-egg-wrap',name:'Egg and cheese sundried tomato wrap',mealType:'Breakfast',timesUsed:1,lastUsedAt,aliases:['egg wrap']},
 {id:'seed-fajita-bowl',name:'Chicken fajita bowl + rice',mealType:'Lunch',timesUsed:1,lastUsedAt,aliases:['fajita bowl']},
 {id:'seed-bologna-rye',name:'Beef bologna on rye',mealType:'Lunch',timesUsed:1,lastUsedAt,aliases:['bologna sandwich']},
 {id:'seed-brisket-bowl',name:'Brisket rice bowl with tzatziki and feta',mealType:'Dinner',timesUsed:1,lastUsedAt,aliases:['brisket bowl']},
 {id:'seed-meat-sauce-pasta',name:'Beef red sauce + angel hair pasta',mealType:'Dinner',timesUsed:1,lastUsedAt,aliases:['meat sauce pasta','beef red sauce']},
 {id:'seed-chicken-rice',name:'Chicken thigh + broccoli + rice',mealType:'Dinner',timesUsed:1,lastUsedAt,aliases:['chicken rice bowl']},
 {id:'seed-chicken-meatballs',name:'Chicken meatballs + vegetables + gravy + rice',mealType:'Dinner',timesUsed:1,lastUsedAt,aliases:['chicken meatballs and rice']},
 {id:'seed-beef-stir-fry',name:'Beef stir-fry + vegetables + rice or noodles',mealType:'Dinner',timesUsed:1,lastUsedAt,aliases:['beef stir fry']},
 {id:'seed-ground-brisket-taco',name:'Ground brisket taco rice bowl',mealType:'Dinner',timesUsed:1,lastUsedAt,aliases:['brisket taco bowl']},
 {id:'seed-banana',name:'Banana',mealType:'Ride Fuel',timesUsed:1,lastUsedAt,aliases:['pre-ride banana']},
 {id:'seed-grapes',name:'Red seedless grapes',mealType:'Snack',timesUsed:1,lastUsedAt,aliases:['grapes']},
 {id:'seed-perfect-bar',name:'Perfect Bar peanut butter',mealType:'Snack',timesUsed:1,lastUsedAt,aliases:['peanut butter Perfect Bar']},
 {id:'seed-perfect-mini',name:'Perfect Protein dark chocolate peanut butter mini',mealType:'Snack',timesUsed:1,lastUsedAt,aliases:['dark chocolate mini','Perfect mini']}
]

export function mergeTrackedMealSeed(existing:NutritionMealTemplate[]):NutritionMealTemplate[]{
 const ids=new Set(existing.map(item=>item.id))
 const names=new Set(existing.map(item=>item.name.trim().toLowerCase()))
 return [...existing,...TRACKED_MEAL_SEED.filter(item=>!ids.has(item.id)&&!names.has(item.name.trim().toLowerCase()))]
}
