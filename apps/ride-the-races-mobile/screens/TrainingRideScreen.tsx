import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { workoutById, workoutSections, type CuratedWorkout } from '../../../src/engine/adaptiveTraining40251'

function formatTime(seconds:number){const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return [h,m,s].map((v,i)=>i===0?String(v):String(v).padStart(2,'0')).join(':')}
function watts(range:[number,number]|undefined,ftp:number|null){if(!range||!ftp)return 'RPE';return Math.round(range[0]*ftp)+'–'+Math.round(range[1]*ftp)+' W'}

export default function TrainingRideScreen({workoutId,ftp,onBack,onFinish}:{workoutId:string;ftp:number|null;onBack:()=>void;onFinish:(durationSeconds:number,workout:CuratedWorkout)=>Promise<void>}){
 const workout=workoutById(workoutId)??workoutById('indoor-endurance-60')!
 const sections=useMemo(()=>workoutSections(workout),[workout.id])
 const total=sections.reduce((sum,s)=>sum+s.durationSeconds,0)
 const [elapsed,setElapsed]=useState(0),[running,setRunning]=useState(false),[saving,setSaving]=useState(false)
 const startRef=useRef<number|null>(null),baseRef=useRef(0)
 useEffect(()=>{if(!running)return;const id=setInterval(()=>{const active=startRef.current?Math.floor((Date.now()-startRef.current)/1000):0;setElapsed(Math.min(total,baseRef.current+active))},500);return()=>clearInterval(id)},[running,total])
 const current=useMemo(()=>{let cursor=0;for(let i=0;i<sections.length;i++){const s=sections[i];if(elapsed<cursor+s.durationSeconds)return {section:s,index:i,remaining:cursor+s.durationSeconds-elapsed,start:cursor};cursor+=s.durationSeconds}return {section:sections[sections.length-1],index:sections.length-1,remaining:0,start:total-sections[sections.length-1].durationSeconds}},[elapsed,sections,total])
 const progress=Math.min(1,elapsed/Math.max(1,total))
 const start=()=>{startRef.current=Date.now();setRunning(true)}
 const pause=()=>{if(!running)return;const active=startRef.current?Math.floor((Date.now()-startRef.current)/1000):0;baseRef.current=Math.min(total,baseRef.current+active);setElapsed(baseRef.current);startRef.current=null;setRunning(false)}
 const resume=()=>{startRef.current=Date.now();setRunning(true)}
 const finish=async()=>{pause();setSaving(true);await onFinish(elapsed,workout);setSaving(false)}
 return <ScrollView contentContainerStyle={s.wrap}>
   <Pressable onPress={onBack}><Text style={s.link}>← Off-Season Training</Text></Pressable>
   <Text style={s.eyebrow}>TODAY'S TRAINING RIDE</Text><Text style={s.title}>{workout.title}</Text>
   <Text style={s.body}>{workout.purpose}</Text>

   <View style={s.profileCard}>
     <Text style={s.label}>WORKOUT PROFILE</Text>
     <View style={s.timeline}>{sections.map((section,i)=><View key={section.id} style={[s.block,{flex:section.durationSeconds,opacity:i<current.index?.45:i===current.index?1:.7,height:section.zone==='Recovery'?26:section.zone==='Endurance'?42:section.zone==='Tempo'?58:section.zone==='Sweet Spot'?68:section.zone==='Threshold'?78:section.zone==='VO2 Max'?88:70}]}/>)}</View>
     <View style={[s.marker,{left:(progress*100)+'%'}]}/>
     <View style={s.profileMeta}><Text style={s.meta}>{workout.durationMinutes} min</Text><Text style={s.meta}>{workout.discipline}</Text><Text style={s.meta}>{workout.primaryZone}</Text></View>
   </View>

   <View style={s.timeCard}><Text style={s.label}>WORKOUT TIME</Text><Text style={s.time}>{formatTime(elapsed)}</Text><Text style={s.subtle}>{formatTime(Math.max(0,total-elapsed))} remaining</Text></View>

   <View style={s.currentCard}>
    <View style={s.top}><Text style={s.label}>CURRENT {current.index+1}/{sections.length}</Text><Text style={s.orange}>{formatTime(current.remaining)}</Text></View>
    <Text style={s.sectionTitle}>{current.section.title}</Text><Text style={s.body}>{current.section.jean}</Text>
    <View style={s.grid}>
      <Metric label="ZONE" value={current.section.zone}/>
      <Metric label="POWER" value={watts(current.section.ftpRange,ftp)}/>
      <Metric label="CADENCE" value={current.section.cadence[0]+'–'+current.section.cadence[1]+' rpm'}/>
      <Metric label="RESISTANCE" value={current.section.resistance}/>
    </View>
   </View>

   <View style={s.next}><Text style={s.label}>UP NEXT</Text><Text style={s.nextTitle}>{sections[current.index+1]?.title??'Workout complete'}</Text></View>

   {elapsed===0&&!running&&<Pressable style={s.primary} onPress={start}><Text style={s.primaryText}>START WORKOUT</Text></Pressable>}
   {running&&<Pressable style={s.warn} onPress={pause}><Text style={s.primaryText}>PAUSE</Text></Pressable>}
   {!running&&elapsed>0&&elapsed<total&&<View style={s.actions}><Pressable style={s.secondary} onPress={resume}><Text style={s.secondaryText}>RESUME</Text></Pressable><Pressable style={s.finish} onPress={finish} disabled={saving}><Text style={s.primaryText}>{saving?'SAVING…':'FINISH'}</Text></Pressable></View>}
   {!running&&elapsed>=total&&<Pressable style={s.finishWide} onPress={finish} disabled={saving}><Text style={s.primaryText}>{saving?'SAVING…':'SAVE WORKOUT'}</Text></Pressable>}
 </ScrollView>
}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.label}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>}
const s=StyleSheet.create({wrap:{padding:20,gap:16},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:1.5},title:{color:'#fff',fontSize:34,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:15,lineHeight:21},profileCard:{padding:16,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:10,position:'relative'},timeline:{height:92,flexDirection:'row',alignItems:'flex-end',gap:2},block:{backgroundColor:'#ff6a00',minWidth:2,borderTopLeftRadius:3,borderTopRightRadius:3},marker:{position:'absolute',top:30,width:3,height:95,backgroundColor:'#fff'},profileMeta:{flexDirection:'row',justifyContent:'space-between'},meta:{color:'#999',fontSize:12,fontWeight:'700'},timeCard:{padding:20,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535'},label:{color:'#858585',fontWeight:'800',letterSpacing:1,fontSize:11},time:{color:'#fff',fontSize:50,fontWeight:'900'},subtle:{color:'#8f8f8f',fontSize:13,fontWeight:'700'},currentCard:{padding:18,borderRadius:18,backgroundColor:'#17120f',borderWidth:1,borderColor:'#64300f',gap:9},top:{flexDirection:'row',justifyContent:'space-between'},orange:{color:'#ff8b3d',fontWeight:'900'},sectionTitle:{color:'#fff',fontSize:25,fontWeight:'900'},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'47%',padding:12,borderRadius:12,backgroundColor:'#101010',gap:4},metricValue:{color:'#fff',fontSize:16,fontWeight:'800'},next:{padding:14,borderRadius:14,backgroundColor:'#111',borderWidth:1,borderColor:'#2d2d2d'},nextTitle:{color:'#fff',fontSize:16,fontWeight:'800',marginTop:4},primary:{backgroundColor:'#ff6a00',padding:18,borderRadius:16,alignItems:'center'},warn:{backgroundColor:'#d98a00',padding:18,borderRadius:16,alignItems:'center'},finish:{backgroundColor:'#c63b2f',padding:18,borderRadius:16,alignItems:'center',flex:1},finishWide:{backgroundColor:'#c63b2f',padding:18,borderRadius:16,alignItems:'center'},secondary:{borderWidth:1,borderColor:'#555',padding:18,borderRadius:16,alignItems:'center',flex:1},actions:{flexDirection:'row',gap:12},primaryText:{color:'#fff',fontWeight:'900',fontSize:16},secondaryText:{color:'#fff',fontWeight:'800'}})
