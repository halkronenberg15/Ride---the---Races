import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'
import { workoutById } from '../../../src/engine/adaptiveTraining40251'

function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}

export default function TrainingScreen({career,onBack,onRide}:{career:CloudCareerSnapshot|null;onBack:()=>void;onRide:(workoutId:string)=>void}){
 const today=localDate()
 const all=career?.alpha4025?.trainingPlan?.weeks.flatMap(w=>w.assignments)??[]
 const upcoming=all.filter(x=>x.status==='PLANNED'&&x.date>=today).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,10)
 const options=(x:(typeof upcoming)[number])=>{
   if(!x.workoutId)return []
   const base=workoutById(x.workoutId)
   const result:Array<{id:string;label:string;note:string}>=[{id:x.workoutId,label:x.environment==='OUTDOOR'?'OPEN OUTDOOR':'OPEN INDOOR',note:'Planned'}]
   if(x.environment==='OUTDOOR'){
     const same=x.durationMinutes===60?'indoor-endurance-60':x.durationMinutes===90?'indoor-endurance-90':x.durationMinutes===120?'indoor-endurance-120':'indoor-endurance-'+String(x.durationMinutes)
     if(workoutById(same))result.push({id:same,label:'SWITCH TO INDOOR '+String(x.durationMinutes),note:'Same duration'})
     if(x.durationMinutes>60&&workoutById('indoor-endurance-60'))result.push({id:'indoor-endurance-60',label:'SHORTEN TO INDOOR 60',note:'Easier double-session option'})
   } else if(base?.environment==='INDOOR'&&x.durationMinutes>=75&&workoutById('indoor-endurance-60')) result.push({id:'indoor-endurance-60',label:'SHORTEN TO 60',note:'Reduced duration'})
   return result
 }
 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>RIDER DEVELOPMENT</Text><Text style={s.title}>Off-Season Training</Text>
  <Text style={s.body}>Today first. Choose the planned ride, switch setting, or shorten it before opening the cockpit.</Text>
  {upcoming.length===0?<View style={s.card}><Text style={s.body}>No upcoming planned assignments found.</Text></View>:upcoming.map(x=><View key={x.id} style={[s.card,x.date===today&&s.today]}>
    <View style={s.top}><Text style={s.label}>{x.date===today?'TODAY · ':''}{x.date}</Text><Text style={s.type}>{x.type}</Text></View>
    <Text style={s.cardTitle}>{x.title??x.workoutId??'Planned session'}</Text><Text style={s.body}>{x.durationMinutes??'—'} min · {x.environment??'FLEXIBLE'}</Text>
    {(x.type==='CYCLING'||x.type==='ASSESSMENT')&&x.workoutId&&<View style={s.actions}>{options(x).map(o=><Pressable key={o.id+o.label} style={o.note==='Planned'?s.primary:s.button} onPress={()=>onRide(o.id)}><Text style={o.note==='Planned'?s.primaryText:s.buttonText}>{o.label}</Text><Text style={s.note}>{o.note}</Text></Pressable>)}</View>}
  </View>)}
 </ScrollView>
}
const s=StyleSheet.create({wrap:{padding:20,gap:16},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2},title:{color:'#fff',fontSize:36,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:16,lineHeight:23},card:{padding:18,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:8},today:{borderColor:'#ff6a00',borderWidth:2},top:{flexDirection:'row',justifyContent:'space-between'},label:{color:'#858585',fontWeight:'800',letterSpacing:1.2,fontSize:12},type:{color:'#ff8b3d',fontSize:12,fontWeight:'900',letterSpacing:1},cardTitle:{color:'#fff',fontWeight:'800',fontSize:18},actions:{gap:8,marginTop:8},primary:{backgroundColor:'#ff6a00',padding:14,borderRadius:13,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900',fontSize:14},button:{borderWidth:1,borderColor:'#555',padding:13,borderRadius:13,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'800',fontSize:14},note:{color:'#9a9a9a',fontSize:11,marginTop:3}})
