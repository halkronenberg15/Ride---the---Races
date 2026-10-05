import { useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'
import { workoutById } from '../../../src/engine/adaptiveTraining40251'

function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function monthKey(date:string){return date.slice(0,7)}
function monthLabel(key:string){const [y,m]=key.split('-').map(Number);return new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(new Date(y,m-1,1))}
const weekdays=['S','M','T','W','T','F','S']
const RECOVERY_KEY='rtr-mobile-recovery-activities-v1'
type RecoveryActivity={id:string;date:string;kind:string;minutes:number;notes?:string}
const RECOVERY_KINDS=['Steam / Sauna','Mobility','Easy Walk','Hydration / Electrolytes','Sleep / Recovery Focus']

export default function TrainingScreen({career,onBack,onRide,onStrength}:{career:CloudCareerSnapshot|null;onBack:()=>void;onRide:(assignment:any,workoutId:string)=>void;onStrength:(assignment:any)=>void}){
 const today=localDate()
 const all=career?.alpha4025?.trainingPlan?.weeks.flatMap(w=>w.assignments)??[]
 const months=useMemo(()=>Array.from(new Set(all.map(x=>monthKey(x.date)))).sort(),[all])
 const initial=Math.max(0,months.indexOf(monthKey(today)))
 const [monthIndex,setMonthIndex]=useState(initial)
 const activeMonth=months[monthIndex]??monthKey(today)
 const [selectedDate,setSelectedDate]=useState(all.some(x=>x.date===today)?today:(all.find(x=>x.status==='PLANNED')?.date??today))
 const [recoveryActivities,setRecoveryActivities]=useState<RecoveryActivity[]>([])
 const [recoveryKind,setRecoveryKind]=useState('Steam / Sauna')
 const [recoveryMinutes,setRecoveryMinutes]=useState('')
 const [recoveryNotes,setRecoveryNotes]=useState('')
 const [recoveryHydrated,setRecoveryHydrated]=useState(false)
 useEffect(()=>{AsyncStorage.getItem(RECOVERY_KEY).then(raw=>{if(raw){try{setRecoveryActivities(JSON.parse(raw) as RecoveryActivity[])}catch{}}setRecoveryHydrated(true)})},[])
 useEffect(()=>{if(recoveryHydrated)AsyncStorage.setItem(RECOVERY_KEY,JSON.stringify(recoveryActivities))},[recoveryHydrated,recoveryActivities])
 const byDate=useMemo(()=>{const map=new Map<string,any[]>();for(const x of all)map.set(x.date,[...(map.get(x.date)??[]),x]);return map},[all])

 const options=(x:any)=>{
   if(!x.workoutId)return []
   const base=workoutById(x.workoutId)
   const result:Array<{id:string;label:string;note:string}>=[{id:x.workoutId,label:x.environment==='OUTDOOR'?'OPEN OUTDOOR':'OPEN INDOOR',note:x.status==='REPLACED'?'Current':'Planned'}]
   if(x.environment==='OUTDOOR'){
     const same=x.durationMinutes===60?'indoor-endurance-60':x.durationMinutes===75?'endurance-steady-75':x.durationMinutes===90?'indoor-endurance-90':x.durationMinutes===120?'indoor-endurance-120':'indoor-endurance-'+String(x.durationMinutes)
     if(workoutById(same))result.push({id:same,label:'SWITCH TO INDOOR '+String(x.durationMinutes),note:'Same duration'})
     if(x.durationMinutes>60&&workoutById('indoor-endurance-60'))result.push({id:'indoor-endurance-60',label:'SHORTEN TO INDOOR 60',note:'Reduced load'})
   } else if(base?.environment==='INDOOR'&&x.durationMinutes>=75&&workoutById('indoor-endurance-60')) result.push({id:'indoor-endurance-60',label:'SHORTEN TO 60',note:'Reduced duration'})
   return result
 }

 const [y,m]=activeMonth.split('-').map(Number)
 const first=new Date(y,m-1,1).getDay()
 const days=new Date(y,m,0).getDate()
 const cells=[...Array(first).fill(null),...Array.from({length:days},(_,i)=>i+1)]
 const selected=byDate.get(selectedDate)??[]
 const recoveryForSelected=recoveryActivities.filter(item=>item.date===selectedDate)
 const isRecoveryDay=selected.some((x:any)=>x.type==='REST'||x.type==='MOBILITY'||x.intensity==='RECOVERY')
 const addRecovery=()=>{
   const minutes=Math.max(0,Number(recoveryMinutes)||0)
   const id=selectedDate+'-'+Date.now()
   setRecoveryActivities(current=>[...current,{id,date:selectedDate,kind:recoveryKind,minutes,notes:recoveryNotes.trim()||undefined}])
   setRecoveryMinutes('')
   setRecoveryNotes('')
 }
 const removeRecovery=(id:string)=>setRecoveryActivities(current=>current.filter(item=>item.id!==id))

 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>OFF-SEASON TRAINING</Text><Text style={s.title}>24-Week Calendar</Text>
  <Text style={s.body}>The weekly rhythm stays recognizable while the rides change with the current block. Monday rest · Tuesday ride + Strength A · Wednesday primary quality · Thursday block-specific support · Friday recovery · Saturday long ride · Sunday endurance + Strength B. Normal cycling floor: 100 miles/week.</Text>

  <View style={s.monthToolbar}>
   <Pressable disabled={monthIndex===0} onPress={()=>setMonthIndex(i=>Math.max(0,i-1))}><Text style={[s.nav,monthIndex===0&&s.disabled]}>‹</Text></Pressable>
   <Text style={s.monthTitle}>{monthLabel(activeMonth)}</Text>
   <Pressable disabled={monthIndex===months.length-1} onPress={()=>setMonthIndex(i=>Math.min(months.length-1,i+1))}><Text style={[s.nav,monthIndex===months.length-1&&s.disabled]}>›</Text></Pressable>
  </View>
  <View style={s.weekRow}>{weekdays.map((d,i)=><Text key={i} style={s.weekday}>{d}</Text>)}</View>
  <View style={s.calendar}>{cells.map((day,i)=>{
    if(day===null)return <View key={'b'+i} style={s.dayBlank}/>
    const date=activeMonth+'-'+String(day).padStart(2,'0')
    const items=byDate.get(date)??[]
    const hasRide=items.some(x=>x.type==='CYCLING'||x.type==='ASSESSMENT')
    const hasStrength=items.some(x=>x.type==='STRENGTH')
    const hasRecovery=recoveryActivities.some(item=>item.date===date)
    const selectedDay=date===selectedDate
    return <Pressable key={date} onPress={()=>setSelectedDate(date)} style={[s.day,selectedDay&&s.daySelected,date===today&&s.today]}>
      <Text style={s.dayNum}>{day}</Text>
      <View style={s.dots}>{hasRide&&<View style={s.rideDot}/>}{hasStrength&&<View style={s.strengthDot}/>}{hasRecovery&&<View style={s.recoveryDot}/>}</View>
    </Pressable>
  })}</View>

  <View style={s.dayDetail}>
    <Text style={s.dayHeading}>{selectedDate===today?'TODAY · ':''}{selectedDate}</Text>
    {selected.length===0?<Text style={s.body}>No training scheduled.</Text>:selected.map((x:any)=><View key={x.id} style={s.card}>
      <View style={s.top}><Text style={s.type}>{x.type}</Text><Text style={s.minutes}>{x.durationMinutes??0} min</Text></View>
      <Text style={s.cardTitle}>{x.title??'Session'}</Text>
      <Text style={s.body}>{x.purpose??x.primary??(x.environment?String(x.environment):'')}</Text>
      {(x.type==='CYCLING'||x.type==='ASSESSMENT')&&x.workoutId&&<View style={s.actions}>{options(x).map(o=><Pressable key={o.id+o.label} style={o.note==='Planned'?s.primary:s.button} onPress={()=>onRide(x,o.id)}><Text style={o.note==='Planned'?s.primaryText:s.buttonText}>{o.label}</Text><Text style={s.note}>{o.note}</Text></Pressable>)}</View>}
      {x.type==='STRENGTH'&&<Pressable style={s.primary} onPress={()=>onStrength(x)}><Text style={s.primaryText}>OPEN {String(x.title??'STRENGTH').toUpperCase()} PLAN</Text></Pressable>}
    </View>)}

    {isRecoveryDay&&<View style={s.recoveryCard}>
      <View style={s.top}><View><Text style={s.recoveryEyebrow}>RECOVERY ACTIVITIES</Text><Text style={s.recoveryTitle}>Active recovery, zero training load</Text></View><Text style={s.zeroLoad}>0 LOAD</Text></View>
      <Text style={s.body}>Log recovery work separately from training so Jimmy can see what you did without counting it as workout stress.</Text>
      <View style={s.kindGrid}>{RECOVERY_KINDS.map(kind=><Pressable key={kind} onPress={()=>setRecoveryKind(kind)} style={[s.kindChip,recoveryKind===kind&&s.kindChipActive]}><Text style={[s.kindText,recoveryKind===kind&&s.kindTextActive]}>{kind}</Text></Pressable>)}</View>
      <View style={s.inputRow}><TextInput style={[s.input,{flex:.35}]} keyboardType="number-pad" placeholder="Minutes" placeholderTextColor="#6f7275" value={recoveryMinutes} onChangeText={setRecoveryMinutes}/><TextInput style={[s.input,{flex:.65}]} placeholder="Notes, rounds, hydration..." placeholderTextColor="#6f7275" value={recoveryNotes} onChangeText={setRecoveryNotes}/></View>
      <Pressable style={s.primary} onPress={addRecovery}><Text style={s.primaryText}>ADD RECOVERY ACTIVITY</Text></Pressable>
      {recoveryForSelected.length>0&&<View style={s.logged}><Text style={s.loggedHeading}>LOGGED TODAY</Text>{recoveryForSelected.map(item=><View key={item.id} style={s.loggedRow}><View style={{flex:1}}><Text style={s.loggedTitle}>{item.kind}{item.minutes>0?' · '+item.minutes+' min':''}</Text>{item.notes&&<Text style={s.loggedNote}>{item.notes}</Text>}</View><Pressable onPress={()=>removeRecovery(item.id)}><Text style={s.remove}>Remove</Text></Pressable></View>)}</View>}
    </View>}
  
  </View>
 </ScrollView>
}
const s=StyleSheet.create({wrap:{padding:20,gap:14},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2},title:{color:'#fff',fontSize:36,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:15,lineHeight:22},monthToolbar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:8},monthTitle:{color:'#fff',fontSize:20,fontWeight:'900'},nav:{color:'#ff8b3d',fontSize:34,fontWeight:'700',paddingHorizontal:12},disabled:{opacity:.25},weekRow:{flexDirection:'row'},weekday:{width:'14.285%',textAlign:'center',color:'#777',fontWeight:'800'},calendar:{flexDirection:'row',flexWrap:'wrap',borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'#2e2e2e'},dayBlank:{width:'14.285%',aspectRatio:1},day:{width:'14.285%',aspectRatio:1,backgroundColor:'#111',borderWidth:.5,borderColor:'#222',padding:5,justifyContent:'space-between'},daySelected:{backgroundColor:'#2a160c',borderColor:'#ff6a00'},today:{borderWidth:2,borderColor:'#ff6a00'},dayNum:{color:'#fff',fontWeight:'800',fontSize:13},dots:{flexDirection:'row',gap:3},rideDot:{width:6,height:6,borderRadius:3,backgroundColor:'#ff6a00'},strengthDot:{width:6,height:6,borderRadius:3,backgroundColor:'#fff'},recoveryDot:{width:6,height:6,borderRadius:3,backgroundColor:'#4da77a'},dayDetail:{gap:12,marginTop:4},dayHeading:{color:'#ff8b3d',fontWeight:'900',letterSpacing:1.2},card:{padding:17,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:9},top:{flexDirection:'row',justifyContent:'space-between'},type:{color:'#ff8b3d',fontWeight:'900',fontSize:12,letterSpacing:1},minutes:{color:'#888',fontWeight:'800'},cardTitle:{color:'#fff',fontWeight:'900',fontSize:20},actions:{gap:8,marginTop:4},primary:{backgroundColor:'#ff6a00',padding:14,borderRadius:13,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900',fontSize:14},button:{borderWidth:1,borderColor:'#555',padding:13,borderRadius:13,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'800',fontSize:14},note:{color:'#9a9a9a',fontSize:11,marginTop:3},recoveryCard:{padding:17,borderRadius:18,backgroundColor:'#101614',borderWidth:1,borderColor:'#335848',gap:11},recoveryEyebrow:{color:'#62b88c',fontWeight:'900',letterSpacing:1.2,fontSize:10},recoveryTitle:{color:'#fff',fontWeight:'900',fontSize:19,marginTop:3},zeroLoad:{color:'#62b88c',fontWeight:'900',fontSize:12},kindGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},kindChip:{paddingVertical:9,paddingHorizontal:10,borderRadius:999,borderWidth:1,borderColor:'#3c4440',backgroundColor:'#151a18'},kindChipActive:{borderColor:'#62b88c',backgroundColor:'#173024'},kindText:{color:'#aaa',fontSize:11,fontWeight:'800'},kindTextActive:{color:'#fff'},inputRow:{flexDirection:'row',gap:8},input:{backgroundColor:'#0b0d0c',borderWidth:1,borderColor:'#343a37',borderRadius:11,padding:11,color:'#fff'},logged:{gap:8,paddingTop:4},loggedHeading:{color:'#7f8582',fontSize:9,fontWeight:'900',letterSpacing:1.1},loggedRow:{flexDirection:'row',alignItems:'center',gap:8,padding:11,borderRadius:11,backgroundColor:'#0b0d0c'},loggedTitle:{color:'#fff',fontWeight:'900',fontSize:13},loggedNote:{color:'#919693',fontSize:11,marginTop:2},remove:{color:'#ff8b3d',fontWeight:'800',fontSize:11}})
