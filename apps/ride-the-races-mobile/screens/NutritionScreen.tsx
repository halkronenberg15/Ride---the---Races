import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'

type Meal={id:string;name:string;notes:string}
type PlanSlot={id:string;time:string;label:string;detail:string}
type NutritionStore={todayMeals:Meal[];weekMeals:Record<string,Meal[]>;shopping:string[];completedPlanIds?:string[]}
const STORAGE_KEY='rtr-mobile-nutrition-v2'
const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const emptyWeek=()=>Object.fromEntries(days.map(day=>[day,[]])) as Record<string,Meal[]>

function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}

function buildTodayPlan(career:CloudCareerSnapshot|null):{slots:PlanSlot[];trainingSummary:string}{
 const today=localDate()
 const assignments=career?.alpha4025?.trainingPlan?.weeks.flatMap(w=>w.assignments)??[]
 const active=assignments.filter(item=>item.date===today&&(item.status==='PLANNED'||item.status==='REPLACED')&&Number(item.durationMinutes??0)>0)
 const cycling=active.filter(item=>item.type==='CYCLING'||item.type==='ASSESSMENT')
 const strength=active.filter(item=>item.type==='STRENGTH')
 const totalMinutes=active.reduce((sum,item)=>sum+Number(item.durationMinutes??0),0)
 const longestRide=Math.max(0,...cycling.map(item=>Number(item.durationMinutes??0)))
 const hard=active.some(item=>item.demandingCycling===true)
 const hasTraining=active.length>0
 const hasRide=cycling.length>0
 const slots:PlanSlot[]=[
  {id:'0930-shake',time:'9:30 AM',label:'Protein shake',detail:'Fairlife Nutrition Plan shake'},
  {id:'1100-snack',time:'11:00 AM',label:'Mid-morning snack',detail:'Protein bar, yogurt bowl, or similar protein-forward snack'},
  {id:'1430-lunch',time:'2:30 PM',label:'Lunch',detail:hasTraining?'Chicken fajita bowl with rice. Keep the carbohydrate portion in because training is scheduled today.':'Protein-forward lunch with vegetables and a moderate carbohydrate portion.'},
 ]

 if(hasTraining){
  slots.push({
   id:'pre-training',
   time:'4:30–5:00 PM',
   label:hasRide?'Pre-ride fuel':'Pre-training fuel',
   detail:hasRide?'Banana or another easy carbohydrate before the ride.':'Small protein + carbohydrate snack before strength work if hungry.'
  })
 }

 if(hasRide&&longestRide>=60){
  slots.push({
   id:'during-ride',
   time:'During ride',
   label:'Ride fuel + hydration',
   detail:longestRide>=90?'LMNT plus 30–45 g carbohydrate per hour.':'LMNT and about 20–30 g carbohydrate during the session if needed.'
  })
 }

 slots.push({
  id:'1900-dinner',
  time:'7:00 PM',
  label:'Dinner',
  detail:hasTraining?(hard||totalMinutes>=90?'Beef red sauce with angel hair pasta. Keep a full carbohydrate serving for recovery.':'Beef red sauce with angel hair pasta or another protein + carbohydrate dinner.'):'Protein-forward dinner with vegetables and a smaller carbohydrate serving.'
 })

 slots.push({
  id:'2030-recovery',
  time:'8:30 PM',
  label:'Evening recovery',
  detail:hasTraining?'Tart cherry + glycine drink. Add a protein mini or shake if daily protein is still short.':'Tart cherry + glycine drink.'
 })

 const trainingSummary=hasTraining
  ? active.map(item=>`${item.title??item.type} · ${item.durationMinutes??0} min`).join(' + ')
  : 'Rest / recovery day'

 return {slots,trainingSummary}
}

export default function NutritionScreen({career,onBack}:{career:CloudCareerSnapshot|null;onBack:()=>void}){
 const [open,setOpen]=useState<'day'|'week'|'shopping'|null>('day')
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
 const [hydrated,setHydrated]=useState(false)
 const todayLabel=useMemo(()=>new Intl.DateTimeFormat('en-US',{weekday:'long',month:'short',day:'numeric'}).format(new Date()),[])
 const todayPlan=useMemo(()=>buildTodayPlan(career),[career])

 useEffect(()=>{AsyncStorage.getItem(STORAGE_KEY).then(raw=>{if(raw){try{const saved=JSON.parse(raw) as NutritionStore;setDayMeals(saved.todayMeals??[]);setWeekMeals({...emptyWeek(),...(saved.weekMeals??{})});setShopping(saved.shopping??[]);setCompletedPlanIds(saved.completedPlanIds??[])}catch{}}setHydrated(true)})},[])
 useEffect(()=>{if(!hydrated)return;AsyncStorage.setItem(STORAGE_KEY,JSON.stringify({todayMeals:dayMeals,weekMeals,shopping,completedPlanIds}))},[hydrated,dayMeals,weekMeals,shopping,completedPlanIds])

 const addMeal=()=>{const name=mealName.trim();if(!name)return;setDayMeals(items=>[...items,{id:String(Date.now()),name,notes:mealNotes.trim()}]);setMealName('');setMealNotes('')}
 const addWeekMeal=()=>{const name=weekDraft.trim();if(!name)return;setWeekMeals(current=>({...current,[selectedDay]:[...(current[selectedDay]??[]),{id:String(Date.now()),name,notes:weekNotes.trim()}]}));setWeekDraft('');setWeekNotes('')}
 const addShopping=()=>{const item=shoppingDraft.trim();if(!item)return;setShopping(items=>[...items,item]);setShoppingDraft('')}
 const togglePlan=(id:string)=>setCompletedPlanIds(ids=>ids.includes(id)?ids.filter(item=>item!==id):[...ids,id])

 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>MISSION FRANCE</Text>
  <Text style={s.title}>Nutrition</Text>
  <Text style={s.body}>Today’s nutrition prescription is built from the training calendar first, then adjusted for the work you actually have scheduled.</Text>

  <Section title="TODAY'S FOOD PLAN" subtitle={todayLabel} open={open==='day'} onPress={()=>setOpen(open==='day'?null:'day')}>
   <View style={s.trainingCard}><Text style={s.trainingLabel}>TODAY'S TRAINING INPUT</Text><Text style={s.trainingTitle}>{todayPlan.trainingSummary}</Text></View>

   <View style={s.planList}>
    {todayPlan.slots.map(slot=>{
     const done=completedPlanIds.includes(slot.id)
     return <Pressable key={slot.id} style={[s.planSlot,done&&s.planSlotDone]} onPress={()=>togglePlan(slot.id)}>
      <View style={s.check}><Text style={s.checkText}>{done?'✓':'○'}</Text></View>
      <View style={s.planCopy}><Text style={s.planTime}>{slot.time}</Text><Text style={s.planTitle}>{slot.label}</Text><Text style={s.planDetail}>{slot.detail}</Text></View>
     </Pressable>
    })}
   </View>

   <Text style={s.subhead}>ACTUAL / CHANGES</Text>
   <Text style={s.helper}>Log substitutions, extra snacks, or anything different from the plan.</Text>
   <View style={s.form}>
    <TextInput style={s.input} placeholder="Meal or food actually eaten" placeholderTextColor="#6f6f6f" value={mealName} onChangeText={setMealName}/>
    <TextInput style={[s.input,s.notes]} placeholder="Amount / notes" placeholderTextColor="#6f6f6f" value={mealNotes} onChangeText={setMealNotes} multiline/>
    <Pressable style={s.primary} onPress={addMeal}><Text style={s.primaryText}>ADD ACTUAL FOOD</Text></Pressable>
   </View>
   {dayMeals.length===0?<Text style={s.empty}>No substitutions or extra foods logged.</Text>:dayMeals.map(meal=><View key={meal.id} style={s.row}><Text style={s.rowTitle}>{meal.name}</Text>{meal.notes?<Text style={s.rowSub}>{meal.notes}</Text>:null}</View>)}
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
 planList:{gap:8},planSlot:{flexDirection:'row',gap:12,padding:14,borderRadius:14,backgroundColor:'#101010',borderWidth:1,borderColor:'#2f2f2f'},planSlotDone:{opacity:.55},check:{width:28},checkText:{color:'#ff8b3d',fontSize:24,fontWeight:'900'},planCopy:{flex:1},planTime:{color:'#ff8b3d',fontWeight:'900',fontSize:12},planTitle:{color:'#fff',fontWeight:'900',fontSize:16,marginTop:2},planDetail:{color:'#a5a5a5',fontSize:13,lineHeight:19,marginTop:3},
 subhead:{color:'#fff',fontWeight:'900',fontSize:14,letterSpacing:.8,marginTop:6},helper:{color:'#888',fontSize:13,lineHeight:18},
 form:{gap:10},input:{backgroundColor:'#0f0f0f',borderWidth:1,borderColor:'#333',borderRadius:12,padding:13,color:'#fff',fontSize:16},notes:{minHeight:70,textAlignVertical:'top'},primary:{backgroundColor:'#ff6a00',padding:14,borderRadius:12,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900'},empty:{color:'#777',fontStyle:'italic'},row:{paddingVertical:10,borderTopWidth:1,borderTopColor:'#262626'},rowTitle:{color:'#fff',fontWeight:'800',fontSize:15},rowSub:{color:'#939393',fontSize:13,marginTop:3},inline:{flexDirection:'row',gap:8},add:{backgroundColor:'#ff6a00',paddingHorizontal:18,borderRadius:12,justifyContent:'center'},dayTabs:{gap:7,paddingVertical:2},dayTab:{paddingVertical:8,paddingHorizontal:12,borderRadius:999,borderWidth:1,borderColor:'#414141'},dayTabActive:{backgroundColor:'#ff6a00',borderColor:'#ff6a00'},dayTabText:{color:'#aaa',fontWeight:'800'},dayTabTextActive:{color:'#fff'},selectedDay:{color:'#ff8b3d',fontWeight:'900',fontSize:17}
})