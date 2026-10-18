import type { CalendarAssignment } from './alpha4025.ts'

export type RecipeCatalogItem={
 id:string
 name:string
 mealType:'Breakfast'|'Lunch'|'Dinner'|'Snack'|'Ride Fuel'|'Recovery'
 minutes:number
 proteinG:number
 carbsG:number
 calories:number
 tags:string[]
 ingredients:Array<{name:string;quantity:number;unit:string}>
 source:'RTR'
 art:string
}

export type WeeklyMealSlot={
 date:string
 day:string
 recipe:RecipeCatalogItem
 reason:string
 trainingLabel:string
}

export type ShoppingItem={
 name:string
 quantity:number
 unit:string
 recipes:string[]
}

export const RECIPE_CATALOG:RecipeCatalogItem[]=[
 {id:'rtr-garlic-soy-noodles',name:'Garlic-Soy Chicken Noodles',mealType:'Dinner',minutes:30,proteinG:42,carbsG:82,calories:690,tags:['high-carb','recovery','quick','asian'],art:'🍜',ingredients:[{name:'Chicken breast',quantity:6,unit:'oz'},{name:'Noodles',quantity:3,unit:'oz dry'},{name:'Broccoli',quantity:1.5,unit:'cups'},{name:'Soy sauce',quantity:2,unit:'tbsp'},{name:'Garlic',quantity:2,unit:'cloves'}]},
 {id:'rtr-beef-rice-bowl',name:'Ginger Beef Rice Bowl',mealType:'Dinner',minutes:25,proteinG:40,carbsG:72,calories:640,tags:['high-carb','recovery','quick','beef'],art:'🥩',ingredients:[{name:'Lean ground beef',quantity:6,unit:'oz'},{name:'Cooked rice',quantity:1.25,unit:'cups'},{name:'Mixed vegetables',quantity:1.5,unit:'cups'},{name:'Ginger',quantity:1,unit:'tbsp'}]},
 {id:'rtr-chicken-pasta',name:'Tomato Chicken Angel Hair',mealType:'Dinner',minutes:35,proteinG:44,carbsG:78,calories:660,tags:['high-carb','recovery','italian'],art:'🍝',ingredients:[{name:'Chicken breast',quantity:6,unit:'oz'},{name:'Angel hair pasta',quantity:3,unit:'oz dry'},{name:'Tomato sauce',quantity:1,unit:'cup'},{name:'Mushrooms',quantity:1,unit:'cup'}]},
 {id:'rtr-fajita-bowl',name:'Chicken Fajita Rice Bowl',mealType:'Dinner',minutes:30,proteinG:41,carbsG:68,calories:610,tags:['high-protein','high-carb','batch'],art:'🥘',ingredients:[{name:'Chicken thighs',quantity:6,unit:'oz'},{name:'Cooked rice',quantity:1,unit:'cup'},{name:'Bell peppers',quantity:1,unit:'cup'},{name:'Onion',quantity:.5,unit:'cup'}]},
 {id:'rtr-brisket-bowl',name:'Brisket Tzatziki Rice Bowl',mealType:'Dinner',minutes:20,proteinG:38,carbsG:62,calories:720,tags:['beef','recovery','comfort'],art:'🥙',ingredients:[{name:'Brisket',quantity:6,unit:'oz'},{name:'Cooked rice',quantity:1,unit:'cup'},{name:'Tzatziki',quantity:2,unit:'oz'},{name:'Feta',quantity:1.5,unit:'oz'}]},
 {id:'rtr-yogurt-granola',name:'Yogurt, Granola & Blueberries',mealType:'Breakfast',minutes:5,proteinG:20,carbsG:42,calories:340,tags:['quick','light','breakfast'],art:'🫐',ingredients:[{name:'Plain yogurt',quantity:1,unit:'cup'},{name:'Granola',quantity:.25,unit:'cup'},{name:'Blueberries',quantity:.5,unit:'cup'}]},
 {id:'rtr-egg-wrap',name:'Cheesy Egg Breakfast Wrap',mealType:'Breakfast',minutes:15,proteinG:28,carbsG:30,calories:420,tags:['protein','breakfast','easy'],art:'🌯',ingredients:[{name:'Eggs',quantity:3,unit:'each'},{name:'Wrap',quantity:1,unit:'each'},{name:'Shredded cheese',quantity:.25,unit:'cup'}]},
 {id:'rtr-chicken-rice-lunch',name:'Simple Chicken & Rice',mealType:'Lunch',minutes:20,proteinG:40,carbsG:58,calories:520,tags:['pre-ride','easy','high-protein'],art:'🍚',ingredients:[{name:'Chicken breast',quantity:5,unit:'oz'},{name:'Cooked rice',quantity:1,unit:'cup'},{name:'Vegetables',quantity:1,unit:'cup'}]},
 {id:'rtr-steak-potato',name:'Steak, Potato & Green Beans',mealType:'Dinner',minutes:35,proteinG:45,carbsG:55,calories:650,tags:['protein','recovery','comfort'],art:'🥔',ingredients:[{name:'Sirloin steak',quantity:6,unit:'oz'},{name:'Potatoes',quantity:10,unit:'oz'},{name:'Green beans',quantity:1.5,unit:'cups'}]},
 {id:'rtr-turkey-sandwich',name:'Turkey Rye Recovery Sandwich',mealType:'Lunch',minutes:10,proteinG:34,carbsG:44,calories:430,tags:['quick','lunch','recovery'],art:'🥪',ingredients:[{name:'Turkey breast',quantity:5,unit:'oz'},{name:'Rye bread',quantity:2,unit:'slices'},{name:'Cheese',quantity:1,unit:'slice'},{name:'Lettuce',quantity:1,unit:'cup'}]},
 {id:'rtr-peanut-butter-oats',name:'Peanut Butter Banana Oats',mealType:'Breakfast',minutes:10,proteinG:24,carbsG:66,calories:510,tags:['pre-ride','high-carb','breakfast'],art:'🥜',ingredients:[{name:'Oats',quantity:.75,unit:'cup'},{name:'Banana',quantity:1,unit:'each'},{name:'Peanut butter',quantity:2,unit:'tbsp'},{name:'Milk',quantity:1,unit:'cup'}]},
 {id:'rtr-chicken-meatballs',name:'Chicken Meatballs, Rice & Gravy',mealType:'Dinner',minutes:40,proteinG:39,carbsG:63,calories:590,tags:['batch','recovery','comfort'],art:'🍲',ingredients:[{name:'Chicken meatballs',quantity:6,unit:'oz'},{name:'Cooked rice',quantity:1,unit:'cup'},{name:'Mixed vegetables',quantity:1,unit:'cup'},{name:'Gravy',quantity:.5,unit:'cup'}]},
]

const dayName=(iso:string)=>new Intl.DateTimeFormat('en-US',{weekday:'short'}).format(new Date(iso+'T12:00:00'))

const trainingFor=(assignments:CalendarAssignment[],date:string)=>{
 const items=assignments.filter(item=>item.date===date&&item.durationMinutes>0)
 const minutes=items.reduce((sum,item)=>sum+item.durationMinutes,0)
 const rideMinutes=items.filter(item=>item.type==='CYCLING'||item.type==='ASSESSMENT').reduce((sum,item)=>sum+item.durationMinutes,0)
 const demanding=items.some(item=>item.demandingCycling||item.intensity==='HARD')
 return {minutes,rideMinutes,demanding,label:items.length?items.map(item=>item.title).join(' + '):'Rest / recovery'}
}

const scoreRecipe=(recipe:RecipeCatalogItem,training:{rideMinutes:number;demanding:boolean},dayIndex:number)=>{
 let score=0
 if(training.rideMinutes>=75&&recipe.tags.includes('high-carb'))score+=8
 if(training.demanding&&recipe.tags.includes('recovery'))score+=7
 if(training.rideMinutes===0&&recipe.carbsG<=65)score+=3
 if(dayIndex>=4&&recipe.tags.includes('batch'))score+=2
 if(recipe.tags.includes('high-protein'))score+=2
 return score
}

export function buildWeeklyMealPlan(args:{
 startDate:string
 assignments:CalendarAssignment[]
 savedRecipeIds:string[]
}):WeeklyMealSlot[]{
 const saved=RECIPE_CATALOG.filter(item=>args.savedRecipeIds.includes(item.id))
 const pool=saved.length?saved:RECIPE_CATALOG
 return Array.from({length:7},(_,index)=>{
  const date=new Date(args.startDate+'T12:00:00')
  date.setDate(date.getDate()+index)
  const iso=date.toISOString().slice(0,10)
  const training=trainingFor(args.assignments,iso)
  const ranked=[...pool].sort((a,b)=>scoreRecipe(b,training,index)-scoreRecipe(a,training,index))
  const recipe=ranked[index%Math.max(1,Math.min(4,ranked.length))]??RECIPE_CATALOG[0]
  const reason=training.rideMinutes>=75?'Higher-carbohydrate meal supports the longer ride and recovery.':training.demanding?'Recovery-focused meal after the quality workload.':training.rideMinutes>0?'Balanced meal supports light training without overfeeding the session.':'Protein-forward meal with moderate carbohydrate for recovery.'
  return {date:iso,day:dayName(iso),recipe,reason,trainingLabel:training.label}
 })
}

export function buildShoppingList(plan:WeeklyMealSlot[]):ShoppingItem[]{
 const map=new Map<string,ShoppingItem>()
 for(const slot of plan){
  for(const ingredient of slot.recipe.ingredients){
   const key=ingredient.name.toLowerCase()+'|'+ingredient.unit
   const prior=map.get(key)
   if(prior){prior.quantity+=ingredient.quantity;prior.recipes.push(slot.recipe.name)}
   else map.set(key,{name:ingredient.name,quantity:ingredient.quantity,unit:ingredient.unit,recipes:[slot.recipe.name]})
  }
 }
 return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name))
}
