import type { FuelDayClass } from './fuelingEngine.ts'

export type MealHorizon='HOUR'|'DAY'|'WEEK'|'MONTH'
export type AppetiteLevel='LOW'|'NORMAL'|'HUNGRY'
export type RecipeCandidate={
 id:string
 name:string
 mealType:'Breakfast'|'Lunch'|'Dinner'|'Snack'|'Ride Fuel'|'Recovery'
 proteinG?:number
 carbsG?:number
 calories?:number
 ingredients?:string[]
 tags:string[]
 source:'RTR'|'USER'|'EXTERNAL'
 sourceUrl?:string
}
export type PlannedMeal={
 id:string
 time:string
 label:string
 recipe:RecipeCandidate
 rationale:string
 priority:'CORE'|'OPTIONAL'|'RIDE_FUEL'
}

const BUILT_INS:RecipeCandidate[]=[
 {id:'rtr-protein-shake',name:'Protein shake',mealType:'Breakfast',proteinG:30,carbsG:4,calories:150,ingredients:['protein shake'],tags:['protein','quick','light','liquid'],source:'RTR'},
 {id:'rtr-yogurt-bowl',name:'Yogurt bowl with granola and berries',mealType:'Snack',proteinG:15,carbsG:35,ingredients:['plain yogurt','granola','berries'],tags:['protein','carb','snack','light'],source:'RTR'},
 {id:'rtr-protein-bar',name:'Protein bar',mealType:'Snack',proteinG:15,carbsG:24,ingredients:['protein bar'],tags:['protein','carb','portable','snack'],source:'RTR'},
 {id:'rtr-banana',name:'Banana',mealType:'Ride Fuel',carbsG:27,calories:105,ingredients:['banana'],tags:['carb','quick','pre-ride','portable','light'],source:'RTR'},
 {id:'rtr-chicken-rice',name:'Chicken and rice bowl',mealType:'Lunch',proteinG:35,carbsG:55,ingredients:['chicken','rice','vegetables'],tags:['protein','carb','meal','pre-ride'],source:'RTR'},
 {id:'rtr-pasta',name:'Pasta with lean protein',mealType:'Dinner',proteinG:35,carbsG:75,ingredients:['pasta','lean protein','tomato sauce'],tags:['protein','carb','meal','recovery'],source:'RTR'},
 {id:'rtr-wrap',name:'Lean-protein wrap',mealType:'Lunch',proteinG:30,carbsG:35,ingredients:['wrap','lean protein','vegetables'],tags:['protein','carb','portable','meal','light'],source:'RTR'},
 {id:'rtr-fruit',name:'Fruit',mealType:'Snack',carbsG:25,ingredients:['fruit'],tags:['carb','snack','quick','light'],source:'RTR'},
 {id:'rtr-tart-cherry',name:'Tart cherry recovery drink',mealType:'Recovery',ingredients:['tart cherry concentrate','water'],tags:['recovery','evening','liquid','light'],source:'RTR'},
]

const score=(candidate:RecipeCandidate,tags:string[],favorites:string[],recent:string[],avoid:string[])=>{
 const name=candidate.name.toLowerCase()
 if(avoid.some(item=>name.includes(item.toLowerCase())))return -999
 let total=tags.reduce((sum,tag)=>sum+(candidate.tags.includes(tag)?3:0),0)
 if(favorites.some(item=>name.includes(item.toLowerCase())||item.toLowerCase().includes(name)))total+=8
 if(recent.some(item=>name.includes(item.toLowerCase())||item.toLowerCase().includes(name)))total+=4
 return total
}
const toMinutes=(value?:string)=>{
 if(!value)return 17*60
 const [h,m]=value.split(':').map(Number)
 if(!Number.isFinite(h)||!Number.isFinite(m))return 17*60
 return Math.max(0,Math.min(1439,h*60+m))
}
const clock=(minutes:number)=>{
 const safe=(minutes+1440)%1440,h=Math.floor(safe/60),m=safe%60,ap=h>=12?'PM':'AM',hh=h%12||12
 return `${hh}:${String(m).padStart(2,'0')} ${ap}`
}
const fixedDinner=(name:string):RecipeCandidate=>({id:'locked-dinner',name,mealType:'Dinner',tags:['protein','carb','meal','recovery','locked'],source:'USER'})

export function recommendRecipe(args:{
 mealType:RecipeCandidate['mealType']
 tags:string[]
 favorites?:string[]
 recentFoods?:string[]
 avoidFoods?:string[]
 userRecipes?:RecipeCandidate[]
 externalRecipes?:RecipeCandidate[]
}):RecipeCandidate{
 const pool=[...(args.userRecipes??[]),...(args.externalRecipes??[]),...BUILT_INS].filter(item=>item.mealType===args.mealType||args.mealType==='Snack')
 const favorites=args.favorites??[],recent=args.recentFoods??[],avoid=args.avoidFoods??[]
 return pool.sort((a,b)=>score(b,args.tags,favorites,recent,avoid)-score(a,args.tags,favorites,recent,avoid))[0]??BUILT_INS[0]
}

export function mealPlanForDay(args:{
 dayClass:FuelDayClass
 trainingTime?:string
 appetite?:AppetiteLevel
 lockedDinner?:string
 favorites?:string[]
 recentFoods?:string[]
 avoidFoods?:string[]
 userRecipes?:RecipeCandidate[]
 externalRecipes?:RecipeCandidate[]
}):PlannedMeal[]{
 const {dayClass}=args
 const appetite=args.appetite??'NORMAL'
 const high=dayClass==='HIGH',ride=dayClass==='RIDE'||high
 const start=toMinutes(args.trainingTime),early=start<11*60,midday=start>=11*60&&start<15*60
 const low=appetite==='LOW',hungry=appetite==='HUNGRY'
 const lightTags=low?['light','liquid']:[]
 const breakfast=recommendRecipe({...args,mealType:'Breakfast',tags:['protein','quick',...lightTags]})
 const snack=recommendRecipe({...args,mealType:'Snack',tags:['protein','carb','snack',...lightTags]})
 const lunch=recommendRecipe({...args,mealType:'Lunch',tags:['protein','carb',hungry?'meal':'light',...lightTags]})
 const pre=recommendRecipe({...args,mealType:'Ride Fuel',tags:['carb','quick','pre-ride','light']})
 const dinner=args.lockedDinner?.trim()?fixedDinner(args.lockedDinner.trim()):recommendRecipe({...args,mealType:'Dinner',tags:['protein','carb','meal','recovery']})
 const recovery=recommendRecipe({...args,mealType:'Recovery',tags:['recovery','evening','light']})
 const plan:PlannedMeal[]=[]

 const morningRationale=low
  ? 'Appetite is low, so Jimmy keeps the first protein hit small and easy to get down.'
  : 'Start protein early without making the morning heavy.'

 if(ride&&early){
  plan.push({id:'pre-ride',time:clock(start-45),label:'Pre-ride fuel',recipe:pre,rationale:'Early ride: protect carbohydrate before the session even if appetite is quiet.',priority:'RIDE_FUEL'})
  plan.push({id:'during',time:'During ride',label:'Ride fuel',recipe:{id:'rtr-ride-carb',name:high?'30–45 g carbohydrate per hour':'20–30 g carbohydrate during the session',mealType:'Ride Fuel',tags:['carb','ride'],source:'RTR'},rationale:'Ride fuel is protected from appetite and weight-loss pressure.',priority:'RIDE_FUEL'})
  plan.push({id:'post',time:clock(start+60),label:'Post-ride protein',recipe:breakfast,rationale:'Small recovery protein first, then build the rest of the day as appetite returns.',priority:'CORE'})
 } else {
  plan.push({id:'breakfast',time:'9:30 AM',label:low?'Light protein anchor':'Protein anchor',recipe:breakfast,rationale:morningRationale,priority:'CORE'})
 }

 if(!early){
  plan.push({id:'snack',time:'11:00 AM',label:low?'Small daytime fuel':'Mid-morning snack',recipe:snack,rationale:low?'Small volume beats skipping the window entirely.':'Protein + carbohydrate keeps the day from becoming an evening catch-up exercise.',priority:low?'OPTIONAL':'CORE'})
 }

 if(!ride||!midday){
  plan.push({id:'lunch',time:ride?clock(Math.max(12*60,start-180)):'1:30 PM',label:low?'Light lunch / fuel bridge':'Lunch',recipe:lunch,rationale:low?'Jimmy keeps lunch compact so you can meet fuel needs without forcing a large meal.':high?'Use a full carbohydrate serving for the day’s larger workload.':ride?'Keep a normal carbohydrate serving because cycling is scheduled.':'Use a moderate carbohydrate serving.',priority:low?'OPTIONAL':'CORE'})
 }

 if(ride&&!early){
  plan.push({id:'pre-ride',time:clock(start-45),label:'Pre-ride fuel',recipe:pre,rationale:'This is the protected pre-ride window. Low appetite does not cancel it.',priority:'RIDE_FUEL'})
  plan.push({id:'during',time:'During ride',label:'Ride fuel',recipe:{id:'rtr-ride-carb',name:high?'30–45 g carbohydrate per hour':'20–30 g carbohydrate during the session',mealType:'Ride Fuel',tags:['carb','ride'],source:'RTR'},rationale:'Ride fuel is protected from appetite and weight-loss pressure.',priority:'RIDE_FUEL'})
 }
 if(ride&&midday){
  plan.push({id:'post-lunch',time:clock(start+90),label:'Post-ride lunch',recipe:lunch,rationale:'Move the larger daytime food after the ride, when appetite may be more cooperative.',priority:'CORE'})
 }

 plan.push({
  id:'dinner',
  time:'7:00 PM',
  label:args.lockedDinner?.trim()?'Locked dinner':'Dinner',
  recipe:dinner,
  rationale:args.lockedDinner?.trim()
   ? (ride?'Dinner is already decided, so Jimmy plans the rest of the day around it and uses it as the main recovery meal.':'Dinner is already decided, so Jimmy keeps earlier intake appropriate to the day.')
   : (ride?'Replace training fuel and finish the day with a full recovery meal.':'Protein-forward dinner with carbohydrate matched to the lower workload.'),
  priority:'CORE',
 })
 plan.push({id:'recovery',time:'8:30 PM',label:'Evening recovery',recipe:recovery,rationale:'Finish with the established recovery routine. Add extra protein only if the day still needs it.',priority:'CORE'})
 return plan
}

export function buildMenuHorizon(horizon:MealHorizon,seed:PlannedMeal[]):Array<{label:string;meals:PlannedMeal[]}>{
 if(horizon==='HOUR')return [{label:'Next fueling window',meals:seed.slice(0,1)}]
 if(horizon==='DAY')return [{label:'Today',meals:seed}]
 if(horizon==='WEEK')return Array.from({length:7},(_,i)=>({label:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],meals:seed}))
 return Array.from({length:4},(_,i)=>({label:`Week ${i+1}`,meals:seed}))
}
