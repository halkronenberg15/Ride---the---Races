import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { workoutById, workoutSections, type CuratedWorkout } from '../../../src/engine/adaptiveTraining40251'
import { buildRideExecutionSummary, rideExecutionSnapshot, transitionCue, type RideExecutionSummary, type RideLegs } from '../../../src/engine/trainingRideExecution'
import ImmersiveRideProfile from '../components/ImmersiveRideProfile'

function formatTime(seconds:number){const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return [h,m,s].map((v,i)=>i===0?String(v):String(v).padStart(2,'0')).join(':')}
function watts(range:[number,number]|undefined,ftp:number|null){if(!range||!ftp)return 'RPE';return Math.round(range[0]*ftp)+'–'+Math.round(range[1]*ftp)+' W'}
function intensity(zone:string){if(/VO2/.test(zone))return .90;if(/Threshold/.test(zone))return .80;if(/Sweet/.test(zone))return .70;if(/Tempo/.test(zone))return .60;if(/Endurance/.test(zone))return .46;if(/Recovery/.test(zone))return .26;return .52}
function buildProfile(sections:ReturnType<typeof workoutSections>){
 const total=sections.reduce((n,s)=>n+s.durationSeconds,0)
 let cursor=0
 const pts:{x:number;y:number}[]=[{x:0,y:.22}]
 sections.forEach((s,i)=>{
  const start=cursor/Math.max(1,total)
  const end=(cursor+s.durationSeconds)/Math.max(1,total)
  const y=intensity(s.zone)
  const lead=Math.max(start,Math.min(end,start+(end-start)*.16))
  const tail=Math.max(start,Math.min(end,end-(end-start)*.12))
  pts.push({x:start,y:Math.max(.18,y-.07)},{x:lead,y},{x:tail,y},{x:end,y:Math.max(.18,y-.05)})
  cursor+=s.durationSeconds
 })
 return pts
}

export default function TrainingRideScreen({workoutId,assignmentId,ftp,onBack,onFinish}:{workoutId:string;assignmentId?:string;ftp:number|null;onBack:()=>void;onFinish:(summary:RideExecutionSummary,workout:CuratedWorkout)=>Promise<void>}){
 const workout=workoutById(workoutId)??workoutById('indoor-endurance-60')!
 const sections=useMemo(()=>workoutSections(workout),[workout.id])
 const total=sections.reduce((sum,s)=>sum+s.durationSeconds,0)
 const profile=useMemo(()=>buildProfile(sections),[sections])
 const [elapsed,setElapsed]=useState(0),[running,setRunning]=useState(false),[saving,setSaving]=useState(false)
 const [pauseCount,setPauseCount]=useState(0),[rpe,setRpe]=useState(5),[legsAfter,setLegsAfter]=useState<RideLegs>('GOOD'),[lastCue,setLastCue]=useState<string|null>(null)
 const startRef=useRef<number|null>(null),baseRef=useRef(0)

 useEffect(()=>{if(!running)return;const id=setInterval(()=>{const active=startRef.current?Math.floor((Date.now()-startRef.current)/1000):0;setElapsed(Math.min(total,baseRef.current+active))},500);return()=>clearInterval(id)},[running,total])

 useEffect(()=>{
  if(!running)return
  const snap=rideExecutionSnapshot(sections,elapsed)
  const cue=transitionCue(snap.secondsToNextTransition,snap.next?.title)
  if(cue&&cue!==lastCue)setLastCue(cue)
  if(snap.completed){baseRef.current=total;startRef.current=null;setRunning(false);setElapsed(total)}
 },[elapsed,running,sections,total,lastCue])

 const execution=useMemo(()=>rideExecutionSnapshot(sections,elapsed),[sections,elapsed])
 const currentSection=sections[execution.current.index]
 const progress=execution.progress
 const next=sections[execution.next?.index??-1]
 const start=()=>{startRef.current=Date.now();setRunning(true)}
 const pause=()=>{if(!running)return;const active=startRef.current?Math.floor((Date.now()-startRef.current)/1000):0;baseRef.current=Math.min(total,baseRef.current+active);setElapsed(baseRef.current);startRef.current=null;setRunning(false);setPauseCount(count=>count+1)}
 const resume=()=>{startRef.current=Date.now();setRunning(true)}
 const finish=async()=>{if(running)pause();const active=running?Math.min(total,baseRef.current):elapsed;const summary=buildRideExecutionSummary({workoutId:workout.id,assignmentId,sections,activeSeconds:active,pauseCount,rpe,legsAfter});setSaving(true);await onFinish(summary,workout);setSaving(false)}

 return <View style={s.root}>
   <View style={s.topBar}><Pressable onPress={onBack}><Text style={s.link}>← Training</Text></Pressable><Text style={s.topTime}>{formatTime(Math.max(0,total-elapsed))} left</Text></View>
   <View>
    <Text style={s.eyebrow}>RTR · INDOOR TRAINING</Text>
    <Text numberOfLines={1} style={s.title}>{workout.title}</Text>
   </View>

   <ImmersiveRideProfile
     points={profile}
     progress={progress}
     label="RIDE PROFILE"
     currentLabel={currentSection.title}
     nextLabel={next?.title??'Finish'}
   />

   <View style={s.currentCard}>
    <View style={s.currentHeader}><View><Text style={s.label}>CURRENT TARGET</Text><Text numberOfLines={1} style={s.sectionTitle}>{currentSection.title}</Text></View><Text style={s.countdown}>{formatTime(execution.sectionRemainingSeconds)}</Text></View>
    <View style={s.metrics}>
      <Metric label="POWER" value={watts(currentSection.ftpRange,ftp)}/>
      <Metric label="CADENCE" value={currentSection.cadence[0]+'–'+currentSection.cadence[1]}/>
      <Metric label="RESISTANCE" value={currentSection.resistance.replace('Light, gradually supported resistance','Light / supported')}/>
      <Metric label="ZONE" value={currentSection.zone}/>
    </View>
    <View style={s.jean}><Text style={s.jeanName}>JEAN</Text><Text numberOfLines={3} style={s.jeanText}>{lastCue??currentSection.jean}</Text></View>
   </View>

   <View style={s.statusStrip}>
    <View><Text style={s.smallLabel}>ELAPSED</Text><Text style={s.statusValue}>{formatTime(elapsed)}</Text></View>
    <View style={s.centerStatus}><Text style={s.smallLabel}>SECTION</Text><Text style={s.statusValue}>{execution.current.index+1}/{sections.length}</Text></View>
    <View style={s.rightStatus}><Text style={s.smallLabel}>UP NEXT</Text><Text numberOfLines={1} style={s.nextText}>{next?.title??'Finish'}</Text></View>
   </View>

   <View style={s.controls}>
    {elapsed===0&&!running&&<Pressable style={s.primary} onPress={start}><Text style={s.primaryText}>START RIDE</Text></Pressable>}
    {running&&<Pressable style={s.pause} onPress={pause}><Text style={s.primaryText}>PAUSE</Text></Pressable>}
    {!running&&elapsed>0&&elapsed<total&&<><Pressable style={s.secondary} onPress={resume}><Text style={s.secondaryText}>RESUME</Text></Pressable><Pressable style={s.finish} onPress={finish} disabled={saving}><Text style={s.primaryText}>{saving?'SAVING…':'END RIDE'}</Text></Pressable></>}
    {!running&&elapsed>=total&&<View style={s.postRide}>
      <Text style={s.label}>POST-RIDE CHECK</Text>
      <Text style={s.postLabel}>RPE {rpe}/10</Text>
      <View style={s.choiceRow}>{[3,4,5,6,7,8,9].map(value=><Pressable key={value} onPress={()=>setRpe(value)} style={[s.choice,rpe===value&&s.choiceActive]}><Text style={s.choiceText}>{value}</Text></Pressable>)}</View>
      <Text style={s.postLabel}>LEGS AFTER</Text>
      <View style={s.choiceRow}>{(['FRESH','GOOD','NOTICEABLE_FATIGUE','HEAVY','VERY_HEAVY'] as RideLegs[]).map(value=><Pressable key={value} onPress={()=>setLegsAfter(value)} style={[s.choice,legsAfter===value&&s.choiceActive]}><Text style={s.choiceText}>{value.replaceAll('_',' ')}</Text></Pressable>)}</View>
      <Pressable style={s.finishWide} onPress={finish} disabled={saving}><Text style={s.primaryText}>{saving?'SAVING…':'SAVE RIDE'}</Text></Pressable>
    </View>}
   </View>
 </View>
}

function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text numberOfLines={2} style={s.metricValue}>{value}</Text></View>}

const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#090909',padding:16,gap:10},
 topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 link:{color:'#ff8b3d',fontWeight:'800',fontSize:14},
 topTime:{color:'#8a8a8a',fontWeight:'800',fontSize:13},
 eyebrow:{color:'#ff6a00',fontWeight:'900',letterSpacing:1.5,fontSize:11},
 title:{color:'#fff',fontSize:27,fontWeight:'900',marginTop:2},
 currentCard:{backgroundColor:'#17120f',borderColor:'#6b3211',borderWidth:1,borderRadius:18,padding:14,gap:10,flexShrink:1},
 currentHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:10},
 label:{color:'#8b8b8b',fontSize:10,fontWeight:'900',letterSpacing:1.1},
 sectionTitle:{color:'#fff',fontSize:22,fontWeight:'900',maxWidth:240,marginTop:3},
 countdown:{color:'#ff8b3d',fontWeight:'900',fontSize:20},
 metrics:{flexDirection:'row',flexWrap:'wrap',gap:8},
 metric:{width:'48%',backgroundColor:'#0d0d0d',borderRadius:12,padding:10,minHeight:64},
 metricLabel:{color:'#6f6f6f',fontSize:9,fontWeight:'900',letterSpacing:1},
 metricValue:{color:'#fff',fontSize:15,fontWeight:'900',marginTop:4},
 jean:{flexDirection:'row',alignItems:'flex-start',gap:8,backgroundColor:'#0e0e0e',borderRadius:12,padding:10},
 jeanName:{color:'#ff8b3d',fontWeight:'900',fontSize:11,letterSpacing:1},
 jeanText:{color:'#d0d0d0',fontSize:13,lineHeight:18,flex:1},
 statusStrip:{flexDirection:'row',backgroundColor:'#101010',borderRadius:14,padding:11,alignItems:'center'},
 smallLabel:{color:'#6f6f6f',fontSize:8,fontWeight:'900',letterSpacing:1},
 statusValue:{color:'#fff',fontWeight:'900',fontSize:15,marginTop:2},
 centerStatus:{alignItems:'center',paddingHorizontal:18},
 rightStatus:{flex:1,alignItems:'flex-end'},
 nextText:{color:'#fff',fontWeight:'800',fontSize:13,maxWidth:145,marginTop:2},
 controls:{flexDirection:'row',gap:10,marginTop:'auto'},postRide:{gap:8,flex:1},postLabel:{color:'#bbb',fontWeight:'800',fontSize:12},choiceRow:{flexDirection:'row',flexWrap:'wrap',gap:6},choice:{paddingVertical:7,paddingHorizontal:9,borderRadius:999,borderWidth:1,borderColor:'#444'},choiceActive:{backgroundColor:'#ff6a00',borderColor:'#ff6a00'},choiceText:{color:'#fff',fontSize:11,fontWeight:'800'},
 primary:{backgroundColor:'#ff6a00',padding:16,borderRadius:15,alignItems:'center',flex:1},
 pause:{backgroundColor:'#d98a00',padding:16,borderRadius:15,alignItems:'center',flex:1},
 finish:{backgroundColor:'#c63b2f',padding:16,borderRadius:15,alignItems:'center',flex:1},
 finishWide:{backgroundColor:'#c63b2f',padding:16,borderRadius:15,alignItems:'center',flex:1},
 secondary:{borderColor:'#555',borderWidth:1,padding:16,borderRadius:15,alignItems:'center',flex:1},
 primaryText:{color:'#fff',fontWeight:'900',fontSize:15,letterSpacing:.5},
 secondaryText:{color:'#fff',fontWeight:'900',fontSize:15}
})
