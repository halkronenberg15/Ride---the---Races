import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'
import { supabase } from '../lib/supabase'
import { evaluateFueling } from '../../../src/engine/fuelingEngine'
import { mealPlanForDay, type AppetiteLevel } from '../../../src/engine/mealPlanningEngine'

type Meal={id:string;name:string;notes:string}
type PlanSlot={id:string;time:string;label:string;detail:string;reason:string;priority?:'CORE'|'OPTIONAL'|'RIDE_FUEL'}
type NutritionStore={
 todayMeals:Meal[]
 weekMeals:Record<string,Meal[]>
 shopping:string[]
 completedPlanIds?:string[]
 trainingTimes?:Record<string,string>
 favorites?:string[]
 avoidFoods?:string[]
 recentFoods?:string[]
 appetite?:AppetiteLevel
 lockedDinner?:string
 goalLowLb?:string
 goalHighLb?:string
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
 avoidFoods:string[],
 appetite:AppetiteLevel,
 lockedDinner:string
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
 const dayClass=longOrHard?'HIGH':moderateRide?'RIDE':hasTraining?'STANDARD':'RECOVERY'
 const sharedPlan=mealPlanForDay({
  dayClass,
  trainingTime,
  appetite,
  lockedDinner,
  favorites,
  recentFoods,
  avoidFoods,
 })
 const slots:PlanSlot[]=sharedPlan.map(item=>({
  id:item.id,
  time:item.time,
  label:item.label,
  detail:item.recipe.name,
  reason:item.rationale,
  priority:item.priority,
 }))
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
 const [appetite,setAppetite]=useState<AppetiteLevel>('NORMAL')
 const [lockedDinner,setLockedDinner]=useState('')
 const [favoriteDraft,setFavoriteDraft]=useState('')
 const [avoidDraft,setAvoidDraft]=useState('')
 const [goalLowLb,setGoalLowLb]=useState('')
 const [goalHighLb,setGoalHighLb]=useState('')
 const [fridgeBusy,setFridgeBusy]=useState(false)
 const [fridgeResult,setFridgeResult]=useState<{visibleFoods?:string[];meals?:Array<{name:string;why:string;ingredients?:string[];addIfAvailable?:string[]}>;note?:string}|null>(null)
 const [hydrated,setHydrated]=useState(false)
 const todayLabel=useMemo(()=>new Intl.DateTimeFormat('en-US',{weekday:'long',month:'short',day:'numeric'}).format(new Date()),[])
 const trainingTime=trainingTimes[today]??DEFAULT_TRAINING_TIME
 const todayPlan=useMemo(()=>buildTodayPlan(career,trainingTime,favorites,recentFoods,avoidFoods,appetite,lockedDinner),[career,trainingTime,favorites,recentFoods,avoidFoods,appetite,lockedDinner])
 const assignments=career?.alpha4025?.trainingPlan?.weeks.flatMap(w=>w.assignments)??[]
 const activeToday=assignments.filter(item=>item.date===today&&(item.status==='PLANNED'||item.status==='REPLACED')&&Number(item.durationMinutes??0)>0)
 const tomorrowDate=new Date();tomorrowDate.setDate(tomorrowDate.getDate()+1);const tomorrowKey=[tomorrowDate.getFullYear(),String(tomorrowDate.getMonth()+1).padStart(2,'0'),String(tomorrowDate.getDate()).padStart(2,'0')].join('-')
 const activeTomorrow=assignments.filter(item=>item.date===tomorrowKey&&(item.status==='PLANNED'||item.status==='REPLACED')&&Number(item.durationMinutes??0)>0)
 const trainingMinutes=activeToday.reduce((sum,item)=>sum+Number(item.durationMinutes??0),0)
 const rideMinutes=activeToday.filter(item=>item.type==='CYCLING'||item.type==='ASSESSMENT').reduce((sum,item)=>sum+Number(item.durationMinutes??0),0)
 const tomorrowMinutes=activeTomorrow.reduce((sum,item)=>sum+Number(item.durationMinutes??0),0)
 const fueling=evaluateFueling({weightKg:career?.rider.weightKg,goalLowKg:goalLowLb?Number(goalLowLb)/2.20462:career?.nutrition?.goalWeightLowKg,goalHighKg:goalHighLb?Number(goalHighLb)/2.20462:career?.nutrition?.goalWeightHighKg,trainingMinutes,rideMinutes,demanding:activeToday.some(item=>item.demandingCycling===true),tomorrowTrainingMinutes:tomorrowMinutes})

 useEffect(()=>{AsyncStorage.getItem(STORAGE_KEY).then(raw=>{if(raw){try{const saved=JSON.parse(raw) as NutritionStore;setDayMeals(saved.todayMeals??[]);setWeekMeals({...emptyWeek(),...(saved.weekMeals??{})});setShopping(saved.shopping??[]);setCompletedPlanIds(saved.completedPlanIds??[]);setTrainingTimes(saved.trainingTimes??{});setFavorites(saved.favorites??[]);setAvoidFoods(saved.avoidFoods??[]);setRecentFoods(saved.recentFoods??[]);setAppetite(saved.appetite??'NORMAL');setLockedDinner(saved.lockedDinner??'');setGoalLowLb(saved.goalLowLb??'');setGoalHighLb(saved.goalHighLb??'')}catch{}}setHydrated(true)})},[])
 useEffect(()=>{if(!hydrated)return;AsyncStorage.setItem(STORAGE_KEY,JSON.stringify({todayMeals:dayMeals,weekMeals,shopping,completedPlanIds,trainingTimes,favorites,avoidFoods,recentFoods,appetite,lockedDinner,goalLowLb,goalHighLb}))},[hydrated,dayMeals,weekMeals,shopping,completedPlanIds,trainingTimes,favorites,avoidFoods,recentFoods,appetite,lockedDinner,goalLowLb,goalHighLb])

 const addMeal=()=>{const name=mealName.trim();if(!name)return;setDayMeals(items=>[...items,{id:String(Date.now()),name,notes:mealNotes.trim()}]);setRecentFoods(items=>[name,...items.filter(item=>normalize(item)!==normalize(name))].slice(0,20));setMealName('');setMealNotes('')}
 const addWeekMeal=()=>{const name=weekDraft.trim();if(!name)return;setWeekMeals(current=>({...current,[selectedDay]:[...(current[selectedDay]??[]),{id:String(Date.now()),name,notes:weekNotes.trim()}]}));setWeekDraft('');setWeekNotes('')}
 const addShopping=()=>{const item=shoppingDraft.trim();if(!item)return;setShopping(items=>[...items,item]);setShoppingDraft('')}
 const togglePlan=(id:string)=>setCompletedPlanIds(ids=>ids.includes(id)?ids.filter(item=>item!==id):[...ids,id])
 const addFavorite=()=>{const value=favoriteDraft.trim();if(!value)return;setFavorites(items=>[value,...items.filter(item=>normalize(item)!==normalize(value))]);setFavoriteDraft('')}
 const addAvoid=()=>{const value=avoidDraft.trim();if(!value)return;setAvoidFoods(items=>[value,...items.filter(item=>normalize(item)!==normalize(value))]);setAvoidDraft('')}
 const analyzeFridge=async()=>{
  const permission=await ImagePicker.requestCameraPermissionsAsync()
  if(!permission.granted)return Alert.alert('Camera permission required','RtR needs camera access to analyze what is in your fridge.')
  const result=await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:.55,base64:true})
  if(result.canceled)return
  const asset=result.assets[0]
  if(!asset.base64)return Alert.alert('Could not read photo','Try taking the fridge photo again.')
  setFridgeBusy(true);setFridgeResult(null)
  try{
   const {data,error}=await supabase.functions.invoke('fridge-meal-suggest',{body:{imageData:`data:${asset.mimeType??'image/jpeg'};base64,${asset.base64}`,dayClass:fueling.dayClass,weightPhase:fueling.weightPhase,trainingSummary:todayPlan.trainingSummary,favorites,avoidFoods}})
   if(error)throw error
   if(data?.error)throw new Error(String(data.error))
   setFridgeResult(data)
  }catch(error){Alert.alert('Fridge analysis unavailable',error instanceof Error?error.message:'Could not analyze the fridge photo.')}
  finally{setFridgeBusy(false)}
 }

 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>MISSION FRANCE</Text>
  <Text style={s.title}>Nutrition</Text>
  <Text style={s.body}>Recommendations use today’s training load, tomorrow’s recovery needs, your weight-loss phase, training time, and the foods this device has learned you prefer or avoid.</Text>

  <View style={s.fuelSummary}>
   <Text style={s.trainingLabel}>{fueling.dayClass} · {fueling.weightPhase}</Text>
   <Text style={s.fuelQuestion}>{fueling.question}</Text>
   <Text style={s.helper}>{fueling.proteinTargetG?`Protein ${fueling.proteinTargetG[0]}–${fueling.proteinTargetG[1]} g`:'Add current weight for protein target'} · {fueling.carbTargetG?`Carbs ${fueling.carbTargetG[0]}–${fueling.carbTargetG[1]} g`:'Add current weight for carb target'}</Text>
   {fueling.guidance.map(item=><Text key={item} style={s.guidance}>• {item}</Text>)}
   <View style={s.goalRow}><TextInput style={[s.input,{flex:1}]} value={goalLowLb} onChangeText={setGoalLowLb} keyboardType="decimal-pad" placeholder="Goal low lb" placeholderTextColor="#6f6f6f"/><TextInput style={[s.input,{flex:1}]} value={goalHighLb} onChangeText={setGoalHighLb} keyboardType="decimal-pad" placeholder="Goal high lb" placeholderTextColor="#6f6f6f"/></View>
  </View>

  <Section title="TODAY'S FOOD PLAN" subtitle={todayLabel} open={open==='day'} onPress={()=>setOpen(open==='day'?null:'day')}>
   <View style={s.trainingCard}><Text style={s.trainingLabel}>{todayPlan.loadLabel}</Text><Text style={s.trainingTitle}>{todayPlan.trainingSummary}</Text></View>

   <View style={s.jimmyPlanner}>
    <Text style={s.subhead}>JIMMY'S PLAN FOR TODAY</Text>
    <Text style={s.helper}>Set appetite, expected training time, and a dinner that is already decided. Jimmy plans the rest of the day around them.</Text>
    <View style={s.appetiteRow}>
     {(['LOW','NORMAL','HUNGRY'] as AppetiteLevel[]).map(level=><Pressable key={level} onPress={()=>setAppetite(level)} style={[s.appetiteChip,appetite===level&&s.appetiteChipActive]}><Text style={[s.appetiteText,appetite===level&&s.appetiteTextActive]}>{level==='LOW'?'LOW APPETITE':level}</Text></Pressable>)}
    </View>
    <TextInput style={s.input} value={lockedDinner} onChangeText={setLockedDinner} placeholder="Locked dinner, if already decided" placeholderTextColor="#6f6f6f"/>
    {appetite==='LOW'&&<Text style={s.guidance}>Low-appetite mode: smaller, lighter daytime fuel while ride fuel and recovery stay protected.</Text>}
   </View>

   {todayPlan.trainingSummary!=='Rest / recovery day'&&<View style={s.timeCard}>
    <View style={{flex:1}}><Text style={s.trainingLabel}>PLANNED TRAINING TIME</Text><Text style={s.helper}>Nutrition timing moves with this time.</Text></View>
    <TextInput style={s.timeInput} value={trainingTime} onChangeText={value=>setTrainingTimes(current=>({...current,[today]:value}))} placeholder="17:00" placeholderTextColor="#777" keyboardType="numbers-and-punctuation"/>
   </View>}

   <View style={s.planList}>
    {todayPlan.slots.map(slot=>{
     const done=completedPlanIds.includes(slot.id)
     return <Pressable key={slot.id} style={[s.planSlot,done&&s.planSlotDone]} onPress={()=>togglePlan(slot.id)}>
      <View style={s.check}><Text style={s.checkText}>{done?'✓':'○'}</Text></View>
      <View style={s.planCopy}><Text style={s.planTime}>{slot.time}</Text><Text style={s.planTitle}>{slot.label}</Text><Text style={s.planDetail}>{slot.detail}</Text><Text style={s.reason}>{slot.reason}</Text>{slot.priority&&<Text style={s.priority}>{slot.priority==='RIDE_FUEL'?'PROTECTED RIDE FUEL':slot.priority==='OPTIONAL'?'OPTIONAL IF APPETITE ALLOWS':'CORE FUEL'}</Text>}</View>
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

  <View style={s.fridgeCard}>
   <Text style={s.subhead}>WHAT CAN I MAKE FROM MY FRIDGE?</Text>
   <Text style={s.helper}>Take a photo. RtR will identify visible foods and suggest meals that fit today’s training, recovery, preferences, and weight phase.</Text>
   <Pressable style={s.primary} onPress={analyzeFridge} disabled={fridgeBusy}><Text style={s.primaryText}>{fridgeBusy?'ANALYZING FRIDGE…':'TAKE FRIDGE PHOTO'}</Text></Pressable>
   {fridgeResult&&<View style={s.fridgeResults}>
    {fridgeResult.visibleFoods?.length?<Text style={s.rowSub}>Visible: {fridgeResult.visibleFoods.join(' · ')}</Text>:null}
    {fridgeResult.meals?.map((meal,index)=><View key={meal.name+index} style={s.row}><Text style={s.rowTitle}>{meal.name}</Text><Text style={s.rowSub}>{meal.why}</Text>{meal.ingredients?.length?<Text style={s.rowSub}>Use: {meal.ingredients.join(', ')}</Text>:null}{meal.addIfAvailable?.length?<Text style={s.rowSub}>Helpful extras: {meal.addIfAvailable.join(', ')}</Text>:null}</View>)}
    {fridgeResult.note?<Text style={s.helper}>{fridgeResult.note}</Text>:null}
   </View>}
  </View>

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
 chips:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{paddingVertical:7,paddingHorizontal:10,borderRadius:999,borderWidth:1,borderColor:'#494949'},chipText:{color:'#bbb',fontWeight:'700',fontSize:12},fuelSummary:{padding:15,borderRadius:16,backgroundColor:'#111318',borderWidth:1,borderColor:'#4b2b17',gap:8},fuelQuestion:{color:'#fff',fontSize:18,fontWeight:'900',lineHeight:24},guidance:{color:'#aaa',fontSize:13,lineHeight:18},goalRow:{flexDirection:'row',gap:8},jimmyPlanner:{gap:9,padding:13,borderRadius:14,backgroundColor:'#12100e',borderWidth:1,borderColor:'#4b2b18'},appetiteRow:{flexDirection:'row',gap:7,flexWrap:'wrap'},appetiteChip:{paddingVertical:8,paddingHorizontal:10,borderRadius:999,borderWidth:1,borderColor:'#454545'},appetiteChipActive:{backgroundColor:'#ff6a00',borderColor:'#ff6a00'},appetiteText:{color:'#aaa',fontSize:10,fontWeight:'900'},appetiteTextActive:{color:'#111'},priority:{color:'#ff8b3d',fontSize:9,fontWeight:'900',letterSpacing:.8,marginTop:4},fridgeCard:{padding:16,borderRadius:18,backgroundColor:'#111318',borderWidth:1,borderColor:'#3d3d3d',gap:10},fridgeResults:{gap:8}
})