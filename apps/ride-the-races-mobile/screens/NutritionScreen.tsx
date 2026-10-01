import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'

type Meal={id:string;name:string;notes:string}
type PlanSlot={id:string;time:string;label:string;detail:string;reason:string}
type NutritionStore={
 todayMeals:Meal[]
 weekMeals:Record<string,Meal[]>
 shopping:string[]
 completedPlanIds?:string[]
 trainingTimes?:Record<string,string>
 favorites?:string[]
 avoidFoods?:string[]
 recentFoods?:string[]
}
const STORAGE_KEY='rtr-mobile-nutrition-v3'
const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const emptyWeek=()=>Object.fromEntries(days.map(day=>[day,[]])) as Record<string,Meal[]>
const DEFAULT_TRAINING_TIME='17:00'

function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n))}
function hmToMinutes(value:string){const [h,m]=value.split(':').map(Number);return clamp((Number.isFinite(h)?h:17)*60+(Number.isFinite(m)?m:0),0,1439)}
function fmt(minutes:number){const safe=(minutes+1440)%1440,h=Math.floor(safe/60),m=safe%60,ap=h>=12?'PM':'AM',hh=h%12||12;return `${hh}:${String(m).padStart(2,'0')} ${ap}`}
function shiftTime(value:string,delta:number){return fmt(hmToMinutes(value)+delta)}
function normalize(s:string){return s.trim().toLowerCase()}
function includesAny(text:string,terms:string[]){const n=normalize(text);return terms.some(term=>n.includes(normalize(term)))}

const GENERIC_LIBRARY=[
 {name:'Protein shake',tags:['protein','quick','light']},
 {name:'Yogurt bowl',tags:['protein','carb','snack']},
 {name:'Protein bar',tags:['protein','carb','portable','snack']},
 {name:'Banana',tags:['carb','quick','pre-ride','portable']},
 {name:'Rice bowl',tags:['protein','carb','meal','pre-ride']},
 {name:'Chicken and rice',tags:['protein','carb','meal','pre-ride']},
 {name:'Pasta with lean protein',tags:['protein','carb','meal','recovery']},
 {name:'Wrap with lean protein',tags:['protein','carb','portable','meal']},
 {name:'Fruit',tags:['carb','snack','quick']},
 {name:'Tart cherry recovery drink',tags:['recovery','evening']},
]

function rankFood(tags:string[],favorites:string[],recentFoods:string[],avoidFoods:string[]){
 const safe=GENERIC_LIBRARY.filter(item=>!avoidFoods.some(avoid=>normalize(item.name).includes(normalize(avoid))))
 const scored=safe.map(item=>{
  let score=tags.reduce((sum,tag)=>sum+(item.tags.includes(tag)?3:0),0)
  if(favorites.some(f=>normalize(item.name).includes(normalize(f))||normalize(f).includes(normalize(item.name))))score+=8
  if(recentFoods.some(f=>normalize(item.name).includes(normalize(f))||normalize(f).includes(normalize(item.name))))score+=4
  return {item,score}
 }).sort((a,b)=>b.score-a.score||a.item.name.localeCompare(b.item.name))
 return scored[0]?.item.name??'Protein-forward meal'
}

function buildTodayPlan(
 career:CloudCareerSnapshot|null,
 trainingTime:string,
 favorites:string[],
 recentFoods:string[],
 avoidFoods:string[]
):{slots:PlanSlot[];trainingSummary:string;loadLabel:string}{
 const today=localDate()
 const assignments=career?.alpha4025?.trainingPlan?.weeks.flatMap(w=>w.assignments)??[]
 const active=assignments.filter(item=>item.date===today&&(item.status==='PLANNED'||item.status==='REPLACED')&&Number(item.durationMinutes??0)>0)
 const cycling=active.filter(item=>item.type==='CYCLING'||item.type==='ASSESSMENT')
 const totalMinutes=active.reduce((sum,item)=>sum+Number(item.durationMinutes??0),0)
 const longestRide=Math.max(0,...cycling.map(item=>Number(item.durationMinutes??0)))
 const hard=active.some(item=>item.demandingCycling===true)
 const hasTraining=active.length>0
 const hasRide=cycling.length>0
 const longOrHard=hard||longestRide>=90||totalMinutes>=120
 const moderateRide=hasRide&&longestRide>=60
 const start=hmToMinutes(trainingTime)
 const early=start<11*60
 const midday=start>=11*60&&start<15*60
 const slots:PlanSlot[]=[]

 const shake=rankFood(['protein','quick'],favorites,recentFoods,avoidFoods)
 const snack=rankFood(['protein','carb','snack'],favorites,recentFoods,avoidFoods)
 const lunch=rankFood(['protein','carb','meal'],favorites,recentFoods,avoidFoods)
 const pre=rankFood(['carb','quick','pre-ride'],favorites,recentFoods,avoidFoods)
 const dinner=rankFood(['protein','carb','meal','recovery'],favorites,recentFoods,avoidFoods)
 const recovery=rankFood(['recovery','evening'],favorites,recentFoods,avoidFoods)

 if(!hasTraining){
  slots.push(
   {id:'0930-shake',time:'9:30 AM',label:'Protein anchor',detail:shake,reason:'Rest day: keep protein steady without forcing extra ride fuel.'},
   {id:'1100-snack',time:'11:00 AM',label:'Mid-morning snack',detail:snack,reason:'A small protein-forward snack fits the lower workload.'},
   {id:'1330-lunch',time:'1:30 PM',label:'Lunch',detail:lunch,reason:'Moderate carbohydrate portion because there is no scheduled training demand.'},
   {id:'1900-dinner',time:'7:00 PM',label:'Dinner',detail:dinner,reason:'Normal recovery meal, not a carb-load meal.'},
   {id:'2030-recovery',time:'8:30 PM',label:'Evening recovery',detail:recovery,reason:'Keep the established evening recovery routine.'},
  )
 } else if(early){
  slots.push(
   {id:'pre-training',time:shiftTime(trainingTime,-45),label:hasRide?'Pre-ride fuel':'Pre-training fuel',detail:pre,reason:'Training is early, so the first food of the day needs to be easy to digest.'},
  )
  if(hasRide&&longestRide>=60)slots.push({id:'during-ride',time:'During training',label:'Ride fuel + hydration',detail:longOrHard?'Electrolytes plus 30–45 g carbohydrate per hour':'Electrolytes plus about 20–30 g carbohydrate during the session',reason:'Fueling scales with ride duration and intensity.'})
  slots.push(
   {id:'post-training',time:shiftTime(trainingTime,longestRide||60),label:'Post-training recovery',detail:shake,reason:'Protein moves earlier because the ride happens before the normal 9:30 slot.'},
   {id:'1100-snack',time:'11:00 AM',label:'Recovery snack',detail:snack,reason:'Replenish after the early session without overloading one meal.'},
   {id:'1330-lunch',time:'1:30 PM',label:'Lunch',detail:lunch,reason:'Keep carbohydrates in because recovery continues after training.'},
   {id:'1900-dinner',time:'7:00 PM',label:'Dinner',detail:dinner,reason:'Complete recovery with a normal protein + carbohydrate meal.'},
   {id:'2030-recovery',time:'8:30 PM',label:'Evening recovery',detail:recovery,reason:'Keep the established evening recovery routine.'},
  )
 } else {
  slots.push(
   {id:'0930-shake',time:'9:30 AM',label:'Protein shake',detail:shake,reason:'Start protein early without making the morning too heavy.'},
   {id:'1100-snack',time:'11:00 AM',label:'Mid-morning snack',detail:snack,reason:moderateRide?'Protein + carbohydrate now helps avoid playing catch-up before the ride.':'Protein-forward snack to support later training.'},
  )
  const lunchTime=midday?shiftTime(trainingTime,-150):'1:30 PM'
  slots.push({id:'lunch',time:lunchTime,label:'Lunch',detail:lunch,reason:longOrHard?'Keep a full carbohydrate serving because today carries meaningful training load.':'Keep a normal carbohydrate serving because training is scheduled.'})
  slots.push({id:'pre-training',time:shiftTime(trainingTime,-45),label:hasRide?'Pre-ride fuel':'Pre-training fuel',detail:pre,reason:'Placed about 45 minutes before the scheduled session so fuel timing follows the calendar.'})
  if(hasRide&&longestRide>=60)slots.push({id:'during-ride',time:'During training',label:'Ride fuel + hydration',detail:longOrHard?'Electrolytes plus 30–45 g carbohydrate per hour':'Electrolytes plus about 20–30 g carbohydrate during the session',reason:'Ride fueling is added only because today has enough cycling volume to justify it.'})
  slots.push(
   {id:'dinner',time:shiftTime(trainingTime,Math.max(90,longestRide+30)),label:'Dinner / recovery meal',detail:dinner,reason:longOrHard?'Use a full carbohydrate serving to replace training fuel.':'Protein + carbohydrate for recovery without unnecessary extra volume.'},
   {id:'2030-recovery',time:'8:30 PM',label:'Evening recovery',detail:recovery,reason:'Finish the day with the established recovery routine.'},
  )
 }

 const trainingSummary=hasTraining?active.map(item=>`${item.title??item.type} · ${item.durationMinutes??0} min`).join(' + '):'Rest / recovery day'
 const loadLabel=!hasTraining?'REST DAY':longOrHard?'HIGH FUEL DAY':hasRide?'RIDE FUEL DAY':'TRAINING DAY'
 return {slots,trainingSummary,loadLabel}
}

export default function NutritionScreen({career,onBack}:{career:CloudCareerSnapshot|null;onBack:()=>void}){
 const today=localDate()
 const [open,setOpen]=useState<'day'|'week'|'shopping'|'profile'|null>('day')
 const [mealName,setMealName]=useState('')
 const [mealNotes,setMealNotes]=useState('')
 const [dayMeals,setDayMeals]=useState<Meal[]>([])
 const [weekMeals,setWeekMeals]=useState<Record<string,Meal[]>>(emptyWeek())
 const [selectedDay,setSelectedDay]=useState(days[new Date().getDay()===0?6:new Date().getDay()-1])
 const [weekDraft,setWeekDraft]=useState('')
 const [weekNotes,setWeekNotes]=useState('')
 const [shopping,setShopping]=useState<string[]>([])
 const [shoppingDraft,setShoppingDraft]=useState('')
 const [completedPlanIds,setCompletedPlanIds]=useState<string[]>([])
 const [trainingTimes,setTrainingTimes]=useState<Record<string,string>>({})
 const [favorites,setFavorites]=useState<string[]>([])
 const [avoidFoods,setAvoidFoods]=useState<string[]>([])
 const [recentFoods,setRecentFoods]=useState<string[]>([])
 const [favoriteDraft,setFavoriteDraft]=useState('')
 const [avoidDraft,setAvoidDraft]=useState('')
 const [hydrated,setHydrated]=useState(false)
 const todayLabel=useMemo(()=>new Intl.DateTimeFormat('en-US',{weekday:'long',month:'short',day:'numeric'}).format(new Date()),[])
 const trainingTime=trainingTimes[today]??DEFAULT_TRAINING_TIME
 const todayPlan=useMemo(()=>buildTodayPlan(career,trainingTime,favorites,recentFoods,avoidFoods),[career,trainingTime,favorites,recentFoods,avoidFoods])

 useEffect(()=>{AsyncStorage.getItem(STORAGE_KEY).then(raw=>{if(raw){try{const saved=JSON.parse(raw) as NutritionStore;setDayMeals(saved.todayMeals??[]);setWeekMeals({...emptyWeek(),...(saved.weekMeals??{})});setShopping(saved.shopping??[]);setCompletedPlanIds(saved.completedPlanIds??[]);setTrainingTimes(saved.trainingTimes??{});setFavorites(saved.favorites??[]);setAvoidFoods(saved.avoidFoods??[]);setRecentFoods(saved.recentFoods??[])}catch{}}setHydrated(true)})},[])
 useEffect(()=>{if(!hydrated)return;AsyncStorage.setItem(STORAGE_KEY,JSON.stringify({todayMeals:dayMeals,weekMeals,shopping,completedPlanIds,trainingTimes,favorites,avoidFoods,recentFoods}))},[hydrated,dayMeals,weekMeals,shopping,completedPlanIds,trainingTimes,favorites,avoidFoods,recentFoods])

 const addMeal=()=>{const name=mealName.trim();if(!name)return;setDayMeals(items=>[...items,{id:String(Date.now()),name,notes:mealNotes.trim()}]);setRecentFoods(items=>[name,...items.filter(item=>normalize(item)!==normalize(name))].slice(0,20));setMealName('');setMealNotes('')}
 const addWeekMeal=()=>{const name=weekDraft.trim();if(!name)return;setWeekMeals(current=>({...current,[selectedDay]:[...(current[selectedDay]??[]),{id:String(Date.now()),name,notes:weekNotes.trim()}]}));setWeekDraft('');setWeekNotes('')}
 const addShopping=()=>{const item=shoppingDraft.trim();if(!item)return;setShopping(items=>[...items,item]);setShoppingDraft('')}
 const togglePlan=(id:string)=>setCompletedPlanIds(ids=>ids.includes(id)?ids.filter(item=>item!==id):[...ids,id])
 const addFavorite=()=>{const value=favoriteDraft.trim();if(!value)return;setFavorites(items=>[value,...items.filter(item=>normalize(item)!==normalize(value))]);setFavoriteDraft('')}
 const addAvoid=()=>{const value=avoidDraft.trim();if(!value)return;setAvoidFoods(items=>[value,...items.filter(item=>normalize(item)!==normalize(value))]);setAvoidDraft('')}

 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>MISSION FRANCE</Text>
  <Text style={s.title}>Nutrition</Text>
  <Text style={s.body}>Recommendations use today’s training load, the time you plan to train, and the foods this device has learned you prefer or avoid.</Text>

  <Section title="TODAY'S FOOD PLAN" subtitle={todayLabel} open={open==='day'} onPress={()=>setOpen(open==='day'?null:'day')}>
   <View style={s.trainingCard}><Text style={s.trainingLabel}>{todayPlan.loadLabel}</Text><Text style={s.trainingTitle}>{todayPlan.trainingSummary}</Text></View>

   {todayPlan.trainingSummary!=='Rest / recovery day'&&<View style={s.timeCard}>
    <View style={{flex:1}}><Text style={s.trainingLabel}>PLANNED TRAINING TIME</Text><Text style={s.helper}>Nutrition timing moves with this time.</Text></View>
    <TextInput style={s.timeInput} value={trainingTime} onChangeText={value=>setTrainingTimes(current=>({...current,[today]:value}))} placeholder="17:00" placeholderTextColor="#777" keyboardType="numbers-and-punctuation"/>
   </View>}

   <View style={s.planList}>
    {todayPlan.slots.map(slot=>{
     const done=completedPlanIds.includes(slot.id)
     return <Pressable key={slot.id} style={[s.planSlot,done&&s.planSlotDone]} onPress={()=>togglePlan(slot.id)}>
      <View style={s.check}><Text style={s.checkText}>{done?'✓':'○'}</Text></View>
      <View style={s.planCopy}><Text style={s.planTime}>{slot.time}</Text><Text style={s.planTitle}>{slot.label}</Text><Text style={s.planDetail}>{slot.detail}</Text><Text style={s.reason}>{slot.reason}</Text></View>
     </Pressable>
    })}
   </View>

   <Text style={s.subhead}>ACTUAL / CHANGES</Text>
   <Text style={s.helper}>What you log here also teaches the suggestion engine what you actually use.</Text>
   <View style={s.form}>
    <TextInput style={s.input} placeholder="Meal or food actually eaten" placeholderTextColor="#6f6f6f" value={mealName} onChangeText={setMealName}/>
    <TextInput style={[s.input,s.notes]} placeholder="Amount / notes" placeholderTextColor="#6f6f6f" value={mealNotes} onChangeText={setMealNotes} multiline/>
    <Pressable style={s.primary} onPress={addMeal}><Text style={s.primaryText}>ADD ACTUAL FOOD</Text></Pressable>
   </View>
   {dayMeals.length===0?<Text style={s.empty}>No substitutions or extra foods logged.</Text>:dayMeals.map(meal=><View key={meal.id} style={s.row}><Text style={s.rowTitle}>{meal.name}</Text>{meal.notes?<Text style={s.rowSub}>{meal.notes}</Text>:null}</View>)}
  </Section>

  <Section title="FOOD PREFERENCES" subtitle="Private on this device" open={open==='profile'} onPress={()=>setOpen(open==='profile'?null:'profile')}>
   <Text style={s.helper}>Favorites are boosted in suggestions. Avoid foods are filtered out.</Text>
   <View style={s.inline}><TextInput style={[s.input,{flex:1}]} placeholder="Favorite food or meal" placeholderTextColor="#6f6f6f" value={favoriteDraft} onChangeText={setFavoriteDraft}/><Pressable style={s.add} onPress={addFavorite}><Text style={s.primaryText}>ADD</Text></Pressable></View>
   <View style={s.chips}>{favorites.map(item=><Pressable key={item} style={s.chip} onPress={()=>setFavorites(items=>items.filter(x=>x!==item))}><Text style={s.chipText}>{item} ×</Text></Pressable>)}</View>
   <View style={s.inline}><TextInput style={[s.input,{flex:1}]} placeholder="Food to avoid" placeholderTextColor="#6f6f6f" value={avoidDraft} onChangeText={setAvoidDraft}/><Pressable style={s.add} onPress={addAvoid}><Text style={s.primaryText}>ADD</Text></Pressable></View>
   <View style={s.chips}>{avoidFoods.map(item=><Pressable key={item} style={s.chip} onPress={()=>setAvoidFoods(items=>items.filter(x=>x!==item))}><Text style={s.chipText}>{item} ×</Text></Pressable>)}</View>
  </Section>

  <Section title="WEEK PLAN" subtitle="Monday through Sunday" open={open==='week'} onPress={()=>setOpen(open==='week'?null:'week')}>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayTabs}>{days.map(day=><Pressable key={day} style={[s.dayTab,selectedDay===day&&s.dayTabActive]} onPress={()=>setSelectedDay(day)}><Text style={[s.dayTabText,selectedDay===day&&s.dayTabTextActive]}>{day.slice(0,3)}</Text></Pressable>)}</ScrollView>
   <Text style={s.selectedDay}>{selectedDay}</Text>
   <TextInput style={s.input} placeholder="Planned meal" placeholderTextColor="#6f6f6f" value={weekDraft} onChangeText={setWeekDraft}/>
   <TextInput style={[s.input,s.notes]} placeholder="Amount / prep notes" placeholderTextColor="#6f6f6f" value={weekNotes} onChangeText={setWeekNotes} multiline/>
   <Pressable style={s.primary} onPress={addWeekMeal}><Text style={s.primaryText}>ADD TO {selectedDay.toUpperCase()}</Text></Pressable>
   {(weekMeals[selectedDay]??[]).length===0?<Text style={s.empty}>No custom meals planned for {selectedDay}.</Text>:(weekMeals[selectedDay]??[]).map(meal=><View key={meal.id} style={s.row}><Text style={s.rowTitle}>{meal.name}</Text>{meal.notes?<Text style={s.rowSub}>{meal.notes}</Text>:null}</View>)}
  </Section>

  <Section title="SHOPPING LIST" subtitle="Build the week from the plan" open={open==='shopping'} onPress={()=>setOpen(open==='shopping'?null:'shopping')}>
   <View style={s.inline}><TextInput style={[s.input,{flex:1}]} placeholder="Add grocery item" placeholderTextColor="#6f6f6f" value={shoppingDraft} onChangeText={setShoppingDraft}/><Pressable style={s.add} onPress={addShopping}><Text style={s.primaryText}>ADD</Text></Pressable></View>
   {shopping.length===0?<Text style={s.empty}>Shopping list is empty.</Text>:shopping.map((item,index)=><Pressable key={item+index} style={s.row} onPress={()=>setShopping(items=>items.filter((_,i)=>i!==index))}><Text style={s.rowTitle}>□ {item}</Text><Text style={s.rowSub}>Tap to remove</Text></Pressable>)}
  </Section>
 </ScrollView>
}

function Section({title,subtitle,open,onPress,children}:{title:string;subtitle:string;open:boolean;onPress:()=>void;children:React.ReactNode}){
 return <View style={s.sectionCard}><Pressable onPress={onPress} style={s.sectionHead}><View><Text style={s.sectionTitle}>{title}</Text><Text style={s.sectionSub}>{subtitle}</Text></View><Text style={s.chev}>{open?'⌃':'⌄'}</Text></Pressable>{open&&<View style={s.sectionBody}>{children}</View>}</View>
}

const s=StyleSheet.create({
 wrap:{padding:20,gap:14},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'900',letterSpacing:2},title:{color:'#fff',fontSize:38,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:15,lineHeight:22},
 sectionCard:{borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',overflow:'hidden'},sectionHead:{padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},sectionTitle:{color:'#fff',fontSize:17,fontWeight:'900'},sectionSub:{color:'#8f8f8f',fontSize:13,marginTop:3},chev:{color:'#ff8b3d',fontSize:24,fontWeight:'900'},sectionBody:{padding:16,paddingTop:0,gap:12},
 trainingCard:{padding:14,borderRadius:14,backgroundColor:'#221208',borderWidth:1,borderColor:'#5b2d10'},trainingLabel:{color:'#ff8b3d',fontSize:10,fontWeight:'900',letterSpacing:1.3},trainingTitle:{color:'#fff',fontSize:16,fontWeight:'900',marginTop:4},
 timeCard:{flexDirection:'row',gap:12,alignItems:'center',padding:14,borderRadius:14,backgroundColor:'#101010',borderWidth:1,borderColor:'#333'},timeInput:{width:88,backgroundColor:'#0b0b0b',borderWidth:1,borderColor:'#3a3a3a',borderRadius:10,padding:11,color:'#fff',fontWeight:'900',textAlign:'center'},
 planList:{gap:8},planSlot:{flexDirection:'row',gap:12,padding:14,borderRadius:14,backgroundColor:'#101010',borderWidth:1,borderColor:'#2f2f2f'},planSlotDone:{opacity:.55},check:{width:28},checkText:{color:'#ff8b3d',fontSize:24,fontWeight:'900'},planCopy:{flex:1},planTime:{color:'#ff8b3d',fontWeight:'900',fontSize:12},planTitle:{color:'#fff',fontWeight:'900',fontSize:16,marginTop:2},planDetail:{color:'#d0d0d0',fontSize:14,lineHeight:20,marginTop:3},reason:{color:'#777',fontSize:12,lineHeight:17,marginTop:5,fontStyle:'italic'},
 subhead:{color:'#fff',fontWeight:'900',fontSize:14,letterSpacing:.8,marginTop:6},helper:{color:'#888',fontSize:13,lineHeight:18},form:{gap:10},input:{backgroundColor:'#0f0f0f',borderWidth:1,borderColor:'#333',borderRadius:12,padding:13,color:'#fff',fontSize:16},notes:{minHeight:70,textAlignVertical:'top'},primary:{backgroundColor:'#ff6a00',padding:14,borderRadius:12,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900'},empty:{color:'#777',fontStyle:'italic'},row:{paddingVertical:10,borderTopWidth:1,borderTopColor:'#262626'},rowTitle:{color:'#fff',fontWeight:'800',fontSize:15},rowSub:{color:'#939393',fontSize:13,marginTop:3},inline:{flexDirection:'row',gap:8},add:{backgroundColor:'#ff6a00',paddingHorizontal:18,borderRadius:12,justifyContent:'center'},dayTabs:{gap:7,paddingVertical:2},dayTab:{paddingVertical:8,paddingHorizontal:12,borderRadius:999,borderWidth:1,borderColor:'#414141'},dayTabActive:{backgroundColor:'#ff6a00',borderColor:'#ff6a00'},dayTabText:{color:'#aaa',fontWeight:'800'},dayTabTextActive:{color:'#fff'},selectedDay:{color:'#ff8b3d',fontWeight:'900',fontSize:17},
 chips:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{paddingVertical:7,paddingHorizontal:10,borderRadius:999,borderWidth:1,borderColor:'#494949'},chipText:{color:'#bbb',fontWeight:'700',fontSize:12}
})