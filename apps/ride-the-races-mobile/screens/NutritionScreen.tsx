import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

type Meal={id:string;name:string;notes:string}
type DayPlan={date:string;meals:Meal[]}

const seedWeek:DayPlan[]=[
 {date:'Monday',meals:[]},{date:'Tuesday',meals:[]},{date:'Wednesday',meals:[]},
 {date:'Thursday',meals:[]},{date:'Friday',meals:[]},{date:'Saturday',meals:[]},{date:'Sunday',meals:[]},
]

export default function NutritionScreen({onBack}:{onBack:()=>void}){
 const [open,setOpen]=useState<'day'|'week'|'shopping'|null>('day')
 const [mealName,setMealName]=useState('')
 const [mealNotes,setMealNotes]=useState('')
 const [dayMeals,setDayMeals]=useState<Meal[]>([])
 const [week,setWeek]=useState(seedWeek)
 const [shopping,setShopping]=useState<string[]>([])
 const [shoppingDraft,setShoppingDraft]=useState('')
 const todayLabel=useMemo(()=>new Intl.DateTimeFormat('en-US',{weekday:'long',month:'short',day:'numeric'}).format(new Date()),[])

 const addMeal=()=>{const name=mealName.trim();if(!name)return;setDayMeals(items=>[...items,{id:String(Date.now()),name,notes:mealNotes.trim()}]);setMealName('');setMealNotes('')}
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
   {week.map(day=><View key={day.date} style={s.dayRow}><Text style={s.rowTitle}>{day.date}</Text><Text style={s.rowSub}>{day.meals.length?day.meals.map(m=>m.name).join(' · '):'Plan meals here'}</Text></View>)}
  </Section>

  <Section title="SHOPPING LIST" subtitle="Build the week from the plan" open={open==='shopping'} onPress={()=>setOpen(open==='shopping'?null:'shopping')}>
   <View style={s.inline}><TextInput style={[s.input,{flex:1}]} placeholder="Add grocery item" placeholderTextColor="#6f6f6f" value={shoppingDraft} onChangeText={setShoppingDraft}/><Pressable style={s.add} onPress={addShopping}><Text style={s.primaryText}>ADD</Text></Pressable></View>
   {shopping.length===0?<Text style={s.empty}>Shopping list is empty.</Text>:shopping.map((item,index)=><View key={item+index} style={s.row}><Text style={s.rowTitle}>• {item}</Text></View>)}
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
 primary:{backgroundColor:'#ff6a00',padding:14,borderRadius:12,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900'},empty:{color:'#777',fontStyle:'italic'},row:{paddingVertical:10,borderTopWidth:1,borderTopColor:'#262626'},rowTitle:{color:'#fff',fontWeight:'800',fontSize:15},rowSub:{color:'#939393',fontSize:13,marginTop:3},dayRow:{paddingVertical:11,borderTopWidth:1,borderTopColor:'#262626'},inline:{flexDirection:'row',gap:8},add:{backgroundColor:'#ff6a00',paddingHorizontal:18,borderRadius:12,justifyContent:'center'}
})