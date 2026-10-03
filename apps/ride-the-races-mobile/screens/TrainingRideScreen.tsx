import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { workoutById, workoutSections, type CuratedWorkout } from '../../../src/engine/adaptiveTraining40251'
import { buildRideExecutionSummary, rideExecutionSnapshot, transitionCue, type RideExecutionSummary, type RideLegs } from '../../../src/engine/trainingRideExecution'
import { JIMMY_LIFECYCLE, jimmyOpening } from '../../../src/engine/jimmyRadio'
import { buildTrainingRideBriefing } from '../../../src/engine/trainingRideBriefing'
import { CLICK_IN_CUE, PRE_RIDE_COUNTDOWN } from '../../../src/engine/preRide'
import { speakAsJeanMobile, stopJeanVoiceMobile } from '../lib/jeanVoice'
import ImmersiveRideProfile from '../components/ImmersiveRideProfile'

function formatTime(seconds:number){const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return [h,m,s].map((v,i)=>i===0?String(v):String(v).padStart(2,'0')).join(':')}
function watts(range:[number,number]|undefined,ftp:number|null){if(!range||!ftp)return 'RPE';return Math.round(range[0]*ftp)+'–'+Math.round(range[1]*ftp)+' W'}
function intensity(zone:string){if(/VO2/.test(zone))return .90;if(/Threshold/.test(zone))return .80;if(/Sweet/.test(zone))return .70;if(/Tempo/.test(zone))return .60;if(/Endurance/.test(zone))return .46;if(/Recovery/.test(zone))return .26;return .52}
function buildProfile(sections:ReturnType<typeof workoutSections>){
 const total=sections.reduce((n,s)=>n+s.durationSeconds,0)
 let cursor=0
 const pts:{x:number;y:number}[]=[{x:0,y:.22}]
 sections.forEach(section=>{
  const start=cursor/Math.max(1,total)
  const end=(cursor+section.durationSeconds)/Math.max(1,total)
  const y=intensity(section.zone)
  const lead=Math.max(start,Math.min(end,start+(end-start)*.16))
  const tail=Math.max(start,Math.min(end,end-(end-start)*.12))
  pts.push({x:start,y:Math.max(.18,y-.07)},{x:lead,y},{x:tail,y},{x:end,y:Math.max(.18,y-.05)})
  cursor+=section.durationSeconds
 })
 return pts
}

export default function TrainingRideScreen({workoutId,assignmentId,ftp,onBack,onFinish}:{workoutId:string;assignmentId?:string;ftp:number|null;onBack:()=>void;onFinish:(summary:RideExecutionSummary,workout:CuratedWorkout)=>Promise<void>}){
 const workout=workoutById(workoutId)??workoutById('indoor-endurance-60')!
 const sections=useMemo(()=>workoutSections(workout),[workout.id])
 const total=sections.reduce((sum,section)=>sum+section.durationSeconds,0)
 const profile=useMemo(()=>buildProfile(sections),[sections])
 const briefing=useMemo(()=>buildTrainingRideBriefing(workout,ftp,sections),[workout,ftp,sections])

 const [view,setView]=useState<'BRIEFING'|'COCKPIT'>('BRIEFING')
 const [elapsed,setElapsed]=useState(0)
 const [running,setRunning]=useState(false)
 const [saving,setSaving]=useState(false)
 const [countdown,setCountdown]=useState<number|null>(null)
 const [pauseCount,setPauseCount]=useState(0)
 const [rpe,setRpe]=useState(5)
 const [legsAfter,setLegsAfter]=useState<RideLegs>('GOOD')
 const [lastCue,setLastCue]=useState<string|null>(null)

 const startRef=useRef<number|null>(null)
 const baseRef=useRef(0)
 const previousSectionRef=useRef(0)
 const spokenTransitionRef=useRef<string|null>(null)
 const completionSpokenRef=useRef(false)
 const countdownTimerRef=useRef<ReturnType<typeof setInterval>|null>(null)

 useEffect(()=>()=>{if(countdownTimerRef.current)clearInterval(countdownTimerRef.current);stopJeanVoiceMobile()},[])

 useEffect(()=>{
  if(!running)return
  const id=setInterval(()=>{
   const active=startRef.current?Math.floor((Date.now()-startRef.current)/1000):0
   setElapsed(Math.min(total,baseRef.current+active))
  },500)
  return()=>clearInterval(id)
 },[running,total])

 const execution=useMemo(()=>rideExecutionSnapshot(sections,elapsed),[sections,elapsed])
 const currentSection=sections[execution.current.index]
 const progress=execution.progress
 const next=sections[execution.next?.index??-1]

 useEffect(()=>{
  if(!running)return
  if(execution.current.index!==previousSectionRef.current){
   previousSectionRef.current=execution.current.index
   spokenTransitionRef.current=null
   setLastCue(currentSection.jean)
   speakAsJeanMobile(`${currentSection.title}. ${currentSection.jean}`)
  }
  const cue=transitionCue(execution.secondsToNextTransition,execution.next?.title,next?.zone)
  if(cue&&cue!==spokenTransitionRef.current){
   spokenTransitionRef.current=cue
   setLastCue(cue)
   speakAsJeanMobile(cue)
  }
  if(execution.completed){
   baseRef.current=total
   startRef.current=null
   setRunning(false)
   setElapsed(total)
   if(!completionSpokenRef.current){
    completionSpokenRef.current=true
    speakAsJeanMobile(JIMMY_LIFECYCLE.complete)
   }
  }
 },[execution,running,currentSection,total])

 const clearCountdown=()=>{
  if(countdownTimerRef.current)clearInterval(countdownTimerRef.current)
  countdownTimerRef.current=null
  setCountdown(null)
 }

 const beginRideClock=()=>{
  previousSectionRef.current=0
  spokenTransitionRef.current=null
  completionSpokenRef.current=false
  startRef.current=Date.now()
  setView('COCKPIT')
  setRunning(true)
  setLastCue(sections[0].jean)
  setTimeout(()=>speakAsJeanMobile(jimmyOpening(sections[0].title,sections[0].jean)),900)
 }

 const start=()=>{
  if(running||countdown!==null)return
  stopJeanVoiceMobile()
  speakAsJeanMobile(CLICK_IN_CUE)
  setCountdown(PRE_RIDE_COUNTDOWN[0])
  let value:number=PRE_RIDE_COUNTDOWN[0]
  countdownTimerRef.current=setInterval(()=>{
   value-=1
   if(value===0){
    clearCountdown()
    beginRideClock()
   }else setCountdown(value)
  },1000)
 }

 const pause=()=>{
  if(!running)return
  const active=startRef.current?Math.floor((Date.now()-startRef.current)/1000):0
  baseRef.current=Math.min(total,baseRef.current+active)
  setElapsed(baseRef.current)
  startRef.current=null
  setRunning(false)
  setPauseCount(count=>count+1)
  speakAsJeanMobile(JIMMY_LIFECYCLE.paused)
 }

 const resume=()=>{
  startRef.current=Date.now()
  setRunning(true)
  speakAsJeanMobile(`Radio reconnected. ${currentSection.title}. ${currentSection.jean}`)
 }

 const resetRide=()=>{
  clearCountdown()
  stopJeanVoiceMobile()
  startRef.current=null
  baseRef.current=0
  previousSectionRef.current=0
  spokenTransitionRef.current=null
  completionSpokenRef.current=false
  setRunning(false)
  setElapsed(0)
  setPauseCount(0)
  setRpe(5)
  setLegsAfter('GOOD')
  setLastCue(null)
  setView('BRIEFING')
 }

 const restart=()=>{
  if(elapsed===0&&!running){resetRide();return}
  Alert.alert('Restart this ride?','Your current ride progress will be discarded and the workout will return to the briefing.',[
   {text:'Cancel',style:'cancel'},
   {text:'Restart',style:'destructive',onPress:resetRide},
  ])
 }

 const finish=async()=>{
  if(running){
   const active=startRef.current?Math.floor((Date.now()-startRef.current)/1000):0
   baseRef.current=Math.min(total,baseRef.current+active)
   startRef.current=null
   setRunning(false)
  }
  const active=Math.min(total,baseRef.current||elapsed)
  const summary=buildRideExecutionSummary({workoutId:workout.id,assignmentId,sections,activeSeconds:active,pauseCount,rpe,legsAfter})
  setSaving(true)
  await onFinish(summary,workout)
  setSaving(false)
 }

 if(view==='BRIEFING'){
  return <View style={s.root}>
   <ScrollView style={s.scroll} contentContainerStyle={s.briefingContent} showsVerticalScrollIndicator={false}>
    <View style={s.topBar}><Pressable onPress={onBack}><Text style={s.link}>← Training</Text></Pressable><Text style={s.topTime}>{briefing.durationLabel}</Text></View>
    <Text style={s.eyebrow}>RTR · RIDE BRIEFING</Text>
    <Text style={s.title}>{workout.title}</Text>
    <ImmersiveRideProfile points={profile} progress={0} label="RIDE PROFILE" currentLabel={sections[0].title} nextLabel={sections[1]?.title??'Finish'}/>
    <View style={s.briefingCard}>
      <Text style={s.briefingPurpose}>{briefing.purpose}</Text>
      <View style={s.briefingGrid}>
       <BriefMetric label="DURATION" value={briefing.durationLabel}/>
       <BriefMetric label="PRIMARY WORK" value={briefing.primaryZone}/>
       <BriefMetric label="POWER / EFFORT" value={briefing.targetPower}/>
       <BriefMetric label="CADENCE" value={briefing.cadence}/>
      </View>
      <View style={s.briefingBlock}><Text style={s.briefingBlockLabel}>STRUCTURE</Text><Text style={s.briefingText}>{briefing.structure}</Text></View>
      <View style={s.briefingBlock}><Text style={s.briefingBlockLabel}>FUELING</Text><Text style={s.briefingText}>{briefing.fueling}</Text></View>
      <View style={s.jean}><Text style={s.jeanName}>JIMMY</Text><Text style={s.jeanText}>{briefing.jeanOpening}</Text></View>
    </View>
   </ScrollView>
   <View style={s.controls}>
    <Pressable style={s.primary} onPress={start}><Text style={s.primaryText}>START RIDE</Text></Pressable>
   </View>
   {countdown!==null&&<View style={s.countdownOverlay}><Text style={s.countdownNumber}>{countdown}</Text><Text style={s.countdownLabel}>START DEVICES · GET READY</Text></View>}
  </View>
 }

 return <View style={s.root}>
  <ScrollView style={s.scroll} contentContainerStyle={s.cockpitContent} showsVerticalScrollIndicator={false}>
   <View style={s.topBar}><Pressable onPress={onBack}><Text style={s.link}>← Training</Text></Pressable><Text style={s.topTime}>{formatTime(Math.max(0,total-elapsed))} left</Text></View>
   <View><Text style={s.eyebrow}>RTR · INDOOR TRAINING</Text><Text numberOfLines={1} style={s.title}>{workout.title}</Text></View>
   <ImmersiveRideProfile points={profile} progress={progress} label="RIDE PROFILE" currentLabel={currentSection.title} nextLabel={next?.title??'Finish'}/>
   <View style={s.currentCard}>
    <View style={s.currentHeader}><View><Text style={s.label}>CURRENT TARGET</Text><Text numberOfLines={1} style={s.sectionTitle}>{currentSection.title}</Text></View><Text style={s.sectionCountdown}>{formatTime(execution.sectionRemainingSeconds)}</Text></View>
    <View style={s.metrics}>
      <Metric label="POWER" value={watts(currentSection.ftpRange,ftp)}/>
      <Metric label="CADENCE" value={currentSection.cadence[0]+'–'+currentSection.cadence[1]}/>
      <Metric label="RESISTANCE" value={currentSection.resistance.replace('Light, gradually supported resistance','Light / supported')}/>
      <Metric label="ZONE" value={currentSection.zone}/>
    </View>
    <View style={s.jean}><Text style={s.jeanName}>JIMMY</Text><Text numberOfLines={3} style={s.jeanText}>{lastCue??currentSection.jean}</Text></View>
   </View>
   <View style={s.statusStrip}>
    <View><Text style={s.smallLabel}>ELAPSED</Text><Text style={s.statusValue}>{formatTime(elapsed)}</Text></View>
    <View style={s.centerStatus}><Text style={s.smallLabel}>SECTION</Text><Text style={s.statusValue}>{execution.current.index+1}/{sections.length}</Text></View>
    <View style={s.rightStatus}><Text style={s.smallLabel}>UP NEXT</Text><Text numberOfLines={1} style={s.nextText}>{next?.title??'Finish'}</Text></View>
   </View>
   {!running&&elapsed>=total&&<View style={s.postRide}>
    <Text style={s.label}>POST-RIDE CHECK</Text>
    <Text style={s.postLabel}>RPE {rpe}/10</Text>
    <View style={s.choiceRow}>{[3,4,5,6,7,8,9].map(value=><Pressable key={value} onPress={()=>setRpe(value)} style={[s.choice,rpe===value&&s.choiceActive]}><Text style={s.choiceText}>{value}</Text></Pressable>)}</View>
    <Text style={s.postLabel}>LEGS AFTER</Text>
    <View style={s.choiceRow}>{(['FRESH','GOOD','NOTICEABLE_FATIGUE','HEAVY','VERY_HEAVY'] as RideLegs[]).map(value=><Pressable key={value} onPress={()=>setLegsAfter(value)} style={[s.choice,legsAfter===value&&s.choiceActive]}><Text style={s.choiceText}>{value.replaceAll('_',' ')}</Text></Pressable>)}</View>
   </View>}
  </ScrollView>

  <View style={s.controls}>
    {running&&<><Pressable style={s.pause} onPress={pause}><Text style={s.primaryText}>PAUSE</Text></Pressable><Pressable style={s.secondary} onPress={restart}><Text style={s.secondaryText}>RESTART</Text></Pressable></>}
    {!running&&elapsed>0&&elapsed<total&&<><Pressable style={s.secondary} onPress={resume}><Text style={s.secondaryText}>RESUME</Text></Pressable><Pressable style={s.restart} onPress={restart}><Text style={s.primaryText}>RESTART</Text></Pressable><Pressable style={s.finish} onPress={finish} disabled={saving}><Text style={s.primaryText}>{saving?'SAVING…':'END'}</Text></Pressable></>}
    {!running&&elapsed>=total&&<><Pressable style={s.secondary} onPress={restart}><Text style={s.secondaryText}>RESTART</Text></Pressable><Pressable style={s.finishWide} onPress={finish} disabled={saving}><Text style={s.primaryText}>{saving?'SAVING…':'SAVE RIDE'}</Text></Pressable></>}
  </View>
 </View>
}

function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text numberOfLines={2} style={s.metricValue}>{value}</Text></View>}
function BriefMetric({label,value}:{label:string;value:string}){return <View style={s.briefMetric}><Text style={s.metricLabel}>{label}</Text><Text style={s.briefMetricValue}>{value}</Text></View>}

const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#090909'},
 scroll:{flex:1},
 briefingContent:{padding:16,paddingBottom:24,gap:12},
 cockpitContent:{padding:16,paddingBottom:24,gap:10},
 topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 link:{color:'#ff8b3d',fontWeight:'800',fontSize:14},
 topTime:{color:'#8a8a8a',fontWeight:'800',fontSize:13},
 eyebrow:{color:'#ff6a00',fontWeight:'900',letterSpacing:1.5,fontSize:11},
 title:{color:'#fff',fontSize:27,fontWeight:'900',marginTop:2},
 currentCard:{backgroundColor:'#17120f',borderColor:'#6b3211',borderWidth:1,borderRadius:18,padding:14,gap:10},
 briefingCard:{backgroundColor:'#121212',borderColor:'#4d2b16',borderWidth:1,borderRadius:18,padding:14,gap:10},
 briefingPurpose:{color:'#fff',fontSize:19,fontWeight:'900',lineHeight:25},
 briefingGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
 briefMetric:{width:'48%',backgroundColor:'#0d0d0d',borderRadius:12,padding:10,minHeight:64},
 briefMetricValue:{color:'#fff',fontSize:13,fontWeight:'900',marginTop:4,lineHeight:18},
 briefingBlock:{backgroundColor:'#0e0e0e',borderRadius:12,padding:10,gap:4},
 briefingBlockLabel:{color:'#ff8b3d',fontSize:9,fontWeight:'900',letterSpacing:1.1},
 briefingText:{color:'#c8c8c8',fontSize:13,lineHeight:19},
 currentHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:10},
 label:{color:'#8b8b8b',fontSize:10,fontWeight:'900',letterSpacing:1.1},
 sectionTitle:{color:'#fff',fontSize:22,fontWeight:'900',maxWidth:240,marginTop:3},
 sectionCountdown:{color:'#ff8b3d',fontWeight:'900',fontSize:20},
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
 controls:{flexDirection:'row',gap:8,paddingHorizontal:16,paddingTop:10,paddingBottom:16,backgroundColor:'#090909',borderTopWidth:1,borderTopColor:'#222'},
 postRide:{gap:8,backgroundColor:'#111',borderRadius:14,padding:12},
 postLabel:{color:'#bbb',fontWeight:'800',fontSize:12},
 choiceRow:{flexDirection:'row',flexWrap:'wrap',gap:6},
 choice:{paddingVertical:7,paddingHorizontal:9,borderRadius:999,borderWidth:1,borderColor:'#444'},
 choiceActive:{backgroundColor:'#ff6a00',borderColor:'#ff6a00'},
 choiceText:{color:'#fff',fontSize:11,fontWeight:'800'},
 primary:{backgroundColor:'#ff6a00',padding:16,borderRadius:15,alignItems:'center',flex:1},
 pause:{backgroundColor:'#d98a00',padding:14,borderRadius:15,alignItems:'center',flex:1},
 restart:{backgroundColor:'#7d3f19',padding:14,borderRadius:15,alignItems:'center',flex:1},
 finish:{backgroundColor:'#c63b2f',padding:14,borderRadius:15,alignItems:'center',flex:1},
 finishWide:{backgroundColor:'#c63b2f',padding:16,borderRadius:15,alignItems:'center',flex:1},
 secondary:{borderColor:'#555',borderWidth:1,padding:14,borderRadius:15,alignItems:'center',flex:1},
 primaryText:{color:'#fff',fontWeight:'900',fontSize:14,letterSpacing:.4},
 secondaryText:{color:'#fff',fontWeight:'900',fontSize:14},
 countdownOverlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,.9)',alignItems:'center',justifyContent:'center',zIndex:20},
 countdownNumber:{color:'#ff6a00',fontSize:120,fontWeight:'900',lineHeight:130},
 countdownLabel:{color:'#fff',fontSize:14,fontWeight:'900',letterSpacing:1.5}
})