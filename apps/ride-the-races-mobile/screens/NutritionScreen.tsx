import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

type Meal={id:string;name:string;notes:string}
type NutritionStore={todayMeals:Meal[];weekMeals:Record<string,Meal[]>;shopping:string[]}
const STORAGE_KEY='rtr-mobile-nutrition-v1'
const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const emptyWeek=()=>Object.fromEntries(days.map(day=>[day,[]])) as Record<string,Meal[]>

export default function NutritionScreen({onBack}:{onBack:()=>void}){
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
 const [hydrated,setHydrated]=useState(false)
 const todayLabel=useMemo(()=>new Intl.DateTimeFormat('en-US',{weekday:'long',month:'short',day:'numeric'}).format(new Date()),[])

 useEffect(()=>{AsyncStorage.getItem(STORAGE_KEY).then(raw=>{if(raw){try{const saved=JSON.parse(raw) as NutritionStore;setDayMeals(saved.todayMeals??[]);setWeekMeals({...emptyWeek(),...(saved.weekMeals??{})});setShopping(saved.shopping??[])}catch{}}setHydrated(true)})},[])
 useEffect(()=>{if(!hydrated)return;AsyncStorage.setItem(STORAGE_KEY,JSON.stringify({todayMeals:dayMeals,weekMeals,shopping}))},[hydrated,dayMeals,weekMeals,shopping])

 const addMeal=()=>{const name=mealName.trim();if(!name)return;setDayMeals(items=>[...items,{id:String(Date.now()),name,notes:mealNotes.trim()}]);setMealName('');setMealNotes('')}
 const addWeekMeal=()=>{const name=weekDraft.trim();if(!name)return;setWeekMeals(current=>({...current,[selectedDay]:[...(current[selectedDay]??[]),{id:String(Date.now()),name,notes:weekNotes.trim()}]}));setWeekDraft('');setWeekNotes('')}
 const addShopping=()=>{const item=shoppingDraft.trim();if(!item)return;setShopping(items=>[...items,item]);setShoppingDraft('')}

 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>MISSION FRANCE</Text>
  <Text style={s.title}>Nutrition</Text>
  <Text style={s.body}>Fuel the work. Keep the daily log simple, then use the week plan and shopping list to make execution easier.</Text>

  <Section title="TODAY'S FOOD PLAN" subtitle={todayLabel} open={open==='day'} onPress={()=>setOpen(open==='day'?null:'day')}>
   <View style={s.form}>
    <TextInput style={s.input} placeholder="Meal or food" placeholderTextColor="#6f6f6f" value={mealName} onChangeText={setMealName}/>
    <TextInput style={[s.input,s.notes]} placeholder="Amount / notes" placeholderTextColor="#6f6f6f" value={mealNotes} onChangeText={setMealNotes} multiline/>
    <Pressable style={s.primary} onPress={addMeal}><Text style={s.primaryText}>ADD MEAL</Text></Pressable>
   </View>
   {dayMeals.length===0?<Text style={s.empty}>No meals entered yet.</Text>:dayMeals.map(meal=><View key={meal.id} style={s.row}><View><Text style={s.rowTitle}>{meal.name}</Text>{meal.notes?<Text style={s.rowSub}>{meal.notes}</Text>:null}</View></View>)}
  </Section>

  <Section title="WEEK PLAN" subtitle="Monday through Sunday" open={open==='week'} onPress={()=>setOpen(open==='week'?null:'week')}>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayTabs}>{days.map(day=><Pressable key={day} style={[s.dayTab,selectedDay===day&&s.dayTabActive]} onPress={()=>setSelectedDay(day)}><Text style={[s.dayTabText,selectedDay===day&&s.dayTabTextActive]}>{day.slice(0,3)}</Text></Pressable>)}</ScrollView>
   <Text style={s.selectedDay}>{selectedDay}</Text>
   <TextInput style={s.input} placeholder="Planned meal" placeholderTextColor="#6f6f6f" value={weekDraft} onChangeText={setWeekDraft}/>
   <TextInput style={[s.input,s.notes]} placeholder="Amount / prep notes" placeholderTextColor="#6f6f6f" value={weekNotes} onChangeText={setWeekNotes} multiline/>
   <Pressable style={s.primary} onPress={addWeekMeal}><Text style={s.primaryText}>ADD TO {selectedDay.toUpperCase()}</Text></Pressable>
   {(weekMeals[selectedDay]??[]).length===0?<Text style={s.empty}>No meals planned for {selectedDay}.</Text>:(weekMeals[selectedDay]??[]).map(meal=><View key={meal.id} style={s.row}><Text style={s.rowTitle}>{meal.name}</Text>{meal.notes?<Text style={s.rowSub}>{meal.notes}</Text>:null}</View>)}
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
 sectionCard:{borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',overflow:'hidden'},
 sectionHead:{padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 sectionTitle:{color:'#fff',fontSize:17,fontWeight:'900'},sectionSub:{color:'#8f8f8f',fontSize:13,marginTop:3},chev:{color:'#ff8b3d',fontSize:24,fontWeight:'900'},
 sectionBody:{padding:16,paddingTop:0,gap:10},form:{gap:10},input:{backgroundColor:'#0f0f0f',borderWidth:1,borderColor:'#333',borderRadius:12,padding:13,color:'#fff',fontSize:16},notes:{minHeight:70,textAlignVertical:'top'},
 primary:{backgroundColor:'#ff6a00',padding:14,borderRadius:12,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900'},empty:{color:'#777',fontStyle:'italic'},row:{paddingVertical:10,borderTopWidth:1,borderTopColor:'#262626'},rowTitle:{color:'#fff',fontWeight:'800',fontSize:15},rowSub:{color:'#939393',fontSize:13,marginTop:3},inline:{flexDirection:'row',gap:8},add:{backgroundColor:'#ff6a00',paddingHorizontal:18,borderRadius:12,justifyContent:'center'},
 dayTabs:{gap:7,paddingVertical:2},dayTab:{paddingVertical:8,paddingHorizontal:12,borderRadius:999,borderWidth:1,borderColor:'#414141'},dayTabActive:{backgroundColor:'#ff6a00',borderColor:'#ff6a00'},dayTabText:{color:'#aaa',fontWeight:'800'},dayTabTextActive:{color:'#fff'},selectedDay:{color:'#ff8b3d',fontWeight:'900',fontSize:17}
})