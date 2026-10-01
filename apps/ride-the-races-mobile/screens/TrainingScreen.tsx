import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'
import { workoutById } from '../../../src/engine/adaptiveTraining40251'

function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function monthKey(date:string){return date.slice(0,7)}
function monthLabel(key:string){const [y,m]=key.split('-').map(Number);return new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(new Date(y,m-1,1))}
const weekdays=['S','M','T','W','T','F','S']

export default function TrainingScreen({career,onBack,onRide,onStrength}:{career:CloudCareerSnapshot|null;onBack:()=>void;onRide:(workoutId:string)=>void;onStrength:(assignment:any)=>void}){
 const today=localDate()
 const all=career?.alpha4025?.trainingPlan?.weeks.flatMap(w=>w.assignments)??[]
 const months=useMemo(()=>Array.from(new Set(all.map(x=>monthKey(x.date)))).sort(),[all])
 const initial=Math.max(0,months.indexOf(monthKey(today)))
 const [monthIndex,setMonthIndex]=useState(initial)
 const activeMonth=months[monthIndex]??monthKey(today)
 const [selectedDate,setSelectedDate]=useState(all.some(x=>x.date===today)?today:(all.find(x=>x.status==='PLANNED')?.date??today))
 const byDate=useMemo(()=>{const map=new Map<string,any[]>();for(const x of all)map.set(x.date,[...(map.get(x.date)??[]),x]);return map},[all])

 const options=(x:any)=>{
   if(!x.workoutId)return []
   const base=workoutById(x.workoutId)
   const result:Array<{id:string;label:string;note:string}>=[{id:x.workoutId,label:x.environment==='OUTDOOR'?'OPEN OUTDOOR':'OPEN INDOOR',note:'Planned'}]
   if(x.environment==='OUTDOOR'){
     const same=x.durationMinutes===60?'indoor-endurance-60':x.durationMinutes===90?'indoor-endurance-90':x.durationMinutes===120?'indoor-endurance-120':'indoor-endurance-'+String(x.durationMinutes)
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

 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>OFF-SEASON TRAINING</Text><Text style={s.title}>24-Week Calendar</Text>
  <Text style={s.body}>Tap a day to see the full ride or strength prescription. Ride setting and duration can be adjusted before the cockpit opens.</Text>

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
    const selectedDay=date===selectedDate
    return <Pressable key={date} onPress={()=>setSelectedDate(date)} style={[s.day,selectedDay&&s.daySelected,date===today&&s.today]}>
      <Text style={s.dayNum}>{day}</Text>
      <View style={s.dots}>{hasRide&&<View style={s.rideDot}/>}{hasStrength&&<View style={s.strengthDot}/>}</View>
    </Pressable>
  })}</View>

  <View style={s.dayDetail}>
    <Text style={s.dayHeading}>{selectedDate===today?'TODAY · ':''}{selectedDate}</Text>
    {selected.length===0?<Text style={s.body}>No training scheduled.</Text>:selected.map((x:any)=><View key={x.id} style={s.card}>
      <View style={s.top}><Text style={s.type}>{x.type}</Text><Text style={s.minutes}>{x.durationMinutes??0} min</Text></View>
      <Text style={s.cardTitle}>{x.title??'Session'}</Text>
      <Text style={s.body}>{x.purpose??x.primary??(x.environment?String(x.environment):'')}</Text>
      {(x.type==='CYCLING'||x.type==='ASSESSMENT')&&x.workoutId&&<View style={s.actions}>{options(x).map(o=><Pressable key={o.id+o.label} style={o.note==='Planned'?s.primary:s.button} onPress={()=>onRide(o.id)}><Text style={o.note==='Planned'?s.primaryText:s.buttonText}>{o.label}</Text><Text style={s.note}>{o.note}</Text></Pressable>)}</View>}
      {x.type==='STRENGTH'&&<Pressable style={s.primary} onPress={()=>onStrength(x)}><Text style={s.primaryText}>OPEN {String(x.title??'STRENGTH').toUpperCase()} PLAN</Text></Pressable>}
    </View>)}
  </View>
 </ScrollView>
}
const s=StyleSheet.create({wrap:{padding:20,gap:14},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2},title:{color:'#fff',fontSize:36,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:15,lineHeight:22},monthToolbar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:8},monthTitle:{color:'#fff',fontSize:20,fontWeight:'900'},nav:{color:'#ff8b3d',fontSize:34,fontWeight:'700',paddingHorizontal:12},disabled:{opacity:.25},weekRow:{flexDirection:'row'},weekday:{width:'14.285%',textAlign:'center',color:'#777',fontWeight:'800'},calendar:{flexDirection:'row',flexWrap:'wrap',borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'#2e2e2e'},dayBlank:{width:'14.285%',aspectRatio:1},day:{width:'14.285%',aspectRatio:1,backgroundColor:'#111',borderWidth:.5,borderColor:'#222',padding:5,justifyContent:'space-between'},daySelected:{backgroundColor:'#2a160c',borderColor:'#ff6a00'},today:{borderWidth:2,borderColor:'#ff6a00'},dayNum:{color:'#fff',fontWeight:'800',fontSize:13},dots:{flexDirection:'row',gap:3},rideDot:{width:6,height:6,borderRadius:3,backgroundColor:'#ff6a00'},strengthDot:{width:6,height:6,borderRadius:3,backgroundColor:'#fff'},dayDetail:{gap:12,marginTop:4},dayHeading:{color:'#ff8b3d',fontWeight:'900',letterSpacing:1.2},card:{padding:17,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:9},top:{flexDirection:'row',justifyContent:'space-between'},type:{color:'#ff8b3d',fontWeight:'900',fontSize:12,letterSpacing:1},minutes:{color:'#888',fontWeight:'800'},cardTitle:{color:'#fff',fontWeight:'900',fontSize:20},actions:{gap:8,marginTop:4},primary:{backgroundColor:'#ff6a00',padding:14,borderRadius:13,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900',fontSize:14},button:{borderWidth:1,borderColor:'#555',padding:13,borderRadius:13,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'800',fontSize:14},note:{color:'#9a9a9a',fontSize:11,marginTop:3}})
