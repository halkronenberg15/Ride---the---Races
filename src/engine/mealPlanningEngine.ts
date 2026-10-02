import type { FuelDayClass } from './fuelingEngine.ts'

export type MealHorizon='HOUR'|'DAY'|'WEEK'|'MONTH'
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
}

const BUILT_INS:RecipeCandidate[]=[
 {id:'rtr-protein-shake',name:'Protein shake',mealType:'Breakfast',proteinG:30,carbsG:4,calories:150,ingredients:['protein shake'],tags:['protein','quick','light'],source:'RTR'},
 {id:'rtr-yogurt-bowl',name:'Yogurt bowl with granola and berries',mealType:'Snack',proteinG:15,carbsG:35,ingredients:['plain yogurt','granola','berries'],tags:['protein','carb','snack'],source:'RTR'},
 {id:'rtr-protein-bar',name:'Protein bar',mealType:'Snack',proteinG:15,carbsG:24,ingredients:['protein bar'],tags:['protein','carb','portable','snack'],source:'RTR'},
 {id:'rtr-banana',name:'Banana',mealType:'Ride Fuel',carbsG:27,calories:105,ingredients:['banana'],tags:['carb','quick','pre-ride','portable'],source:'RTR'},
 {id:'rtr-chicken-rice',name:'Chicken and rice bowl',mealType:'Lunch',proteinG:35,carbsG:55,ingredients:['chicken','rice','vegetables'],tags:['protein','carb','meal','pre-ride'],source:'RTR'},
 {id:'rtr-pasta',name:'Pasta with lean protein',mealType:'Dinner',proteinG:35,carbsG:75,ingredients:['pasta','lean protein','tomato sauce'],tags:['protein','carb','meal','recovery'],source:'RTR'},
 {id:'rtr-wrap',name:'Lean-protein wrap',mealType:'Lunch',proteinG:30,carbsG:35,ingredients:['wrap','lean protein','vegetables'],tags:['protein','carb','portable','meal'],source:'RTR'},
 {id:'rtr-tart-cherry',name:'Tart cherry recovery drink',mealType:'Recovery',ingredients:['tart cherry concentrate','water'],tags:['recovery','evening'],source:'RTR'},
]

const score=(candidate:RecipeCandidate,tags:string[],favorites:string[],recent:string[],avoid:string[])=>{
 const name=candidate.name.toLowerCase()
 if(avoid.some(item=>name.includes(item.toLowerCase())))return -999
 let total=tags.reduce((sum,tag)=>sum+(candidate.tags.includes(tag)?3:0),0)
 if(favorites.some(item=>name.includes(item.toLowerCase())||item.toLowerCase().includes(name)))total+=8
 if(recent.some(item=>name.includes(item.toLowerCase())||item.toLowerCase().includes(name)))total+=4
 return total
}

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
 favorites?:string[]
 recentFoods?:string[]
 avoidFoods?:string[]
 userRecipes?:RecipeCandidate[]
 externalRecipes?:RecipeCandidate[]
}):PlannedMeal[]{
 const {dayClass}=args
 const high=dayClass==='HIGH',ride=dayClass==='RIDE'||high
 const plan:PlannedMeal[]=[
  {id:'breakfast',time:'9:30 AM',label:'Protein anchor',recipe:recommendRecipe({...args,mealType:'Breakfast',tags:['protein','quick']}),rationale:'Start protein early without making the morning heavy.'},
  {id:'snack',time:'11:00 AM',label:'Mid-morning snack',recipe:recommendRecipe({...args,mealType:'Snack',tags:['protein','carb','snack']}),rationale:ride?'Protein + carbohydrate now reduces the need to catch up before training.':'A modest snack supports satiety and daily protein.'},
  {id:'lunch',time:'1:30 PM',label:'Lunch',recipe:recommendRecipe({...args,mealType:'Lunch',tags:['protein','carb','meal']}),rationale:high?'Use a full carbohydrate serving for the day’s larger workload.':ride?'Keep a normal carbohydrate serving because cycling is scheduled.':'Use a moderate carbohydrate serving.'},
 ]
 if(ride)plan.push({id:'pre-ride',time:'45 min pre-ride',label:'Pre-ride fuel',recipe:recommendRecipe({...args,mealType:'Ride Fuel',tags:['carb','quick','pre-ride']}),rationale:'Keep the final pre-ride food easy to digest and carbohydrate-forward.'})
 if(ride)plan.push({id:'during',time:'During ride',label:'Ride fuel',recipe:{id:'rtr-ride-carb',name:high?'30–45 g carbohydrate per hour':'20–30 g carbohydrate during the session',mealType:'Ride Fuel',tags:['carb','ride'],source:'RTR'},rationale:'Ride fueling is protected from the weight-loss deficit.'})
 plan.push({id:'dinner',time:'7:00 PM',label:ride?'Dinner / recovery':'Dinner',recipe:recommendRecipe({...args,mealType:'Dinner',tags:['protein','carb','meal','recovery']}),rationale:ride?'Replace training fuel and support tomorrow without turning the whole day into a surplus.':'Protein-forward dinner with lower carbohydrate demand.'})
 plan.push({id:'recovery',time:'8:30 PM',label:'Evening recovery',recipe:recommendRecipe({...args,mealType:'Recovery',tags:['recovery','evening']}),rationale:'Finish the day with the established recovery routine.'})
 return plan
}

export function buildMenuHorizon(horizon:MealHorizon,seed:PlannedMeal[]):Array<{label:string;meals:PlannedMeal[]}>{
 if(horizon==='HOUR')return [{label:'Next fueling window',meals:seed.slice(0,1)}]
 if(horizon==='DAY')return [{label:'Today',meals:seed}]
 if(horizon==='WEEK')return Array.from({length:7},(_,i)=>({label:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],meals:seed}))
 return Array.from({length:4},(_,i)=>({label:`Week ${i+1}`,meals:seed}))
}
