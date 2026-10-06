import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import ImmersiveRideProfile from '../components/ImmersiveRideProfile'
import GradientClimbProfile from '../components/GradientClimbProfile'
import RouteMapCard from '../components/RouteMapCard'
import CourseMarkerStrip from '../components/CourseMarkerStrip'
import { isClimbStage, routeThemeFor } from '../lib/routeThemes'
import { speakAsJimmyMobile, stopJimmyVoiceMobile } from '../lib/jimmyVoice'
import { jimmyOpening, jimmyTransitionCue, JIMMY_LIFECYCLE } from '../../../src/engine/jimmyRadio'
import type { OfficialCourseMarker } from '../../../src/data/courseMarkers'
import type { RaceStage } from '../../../src/data/raceStages'

function formatTime(seconds:number){const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return [h,m,s].map((v,i)=>i===0?String(v):String(v).padStart(2,'0')).join(':')}
function segmentAt(stage:RaceStage,elapsed:number){let cursor=0;for(let i=0;i<stage.segments.length;i++){const seg=stage.segments[i];if(elapsed<cursor+seg.sec)return {segment:seg,index:i,segmentElapsed:elapsed-cursor,segmentRemaining:cursor+seg.sec-elapsed};cursor+=seg.sec}return {segment:stage.segments[stage.segments.length-1],index:stage.segments.length-1,segmentElapsed:0,segmentRemaining:0}}
function terrainIcon(text:string){const t=text.toLowerCase();if(/climb|mountain|summit|col |category/.test(t))return '▲';if(/descent/.test(t))return '↘';if(/sprint|finish|lead/.test(t))return '⚡';return '→'}

export default function StructuredRideScreen({stage,onBack,onFinish}:{stage:RaceStage;onBack:()=>void;onFinish:(durationSeconds:number)=>Promise<void>}){
 const total=useMemo(()=>stage.segments.reduce((sum,s)=>sum+s.sec,0),[stage])
 const [elapsed,setElapsed]=useState(0),[running,setRunning]=useState(false),[saving,setSaving]=useState(false),[cockpitView,setCockpitView]=useState<'TARGETS'|'COURSE'|'JIMMY'>('TARGETS'),[lastCue,setLastCue]=useState<string|null>(null)
 const startRef=useRef<number|null>(null),baseRef=useRef(0),lastSectionRef=useRef(-1),lastTransitionRef=useRef('')
 useEffect(()=>()=>stopJimmyVoiceMobile(),[])
 useEffect(()=>{if(!running)return;const id=setInterval(()=>{const active=startRef.current?Math.floor((Date.now()-startRef.current)/1000):0;setElapsed(Math.min(total,baseRef.current+active))},500);return()=>clearInterval(id)},[running,total])
 useEffect(()=>{if(elapsed>=total&&running){baseRef.current=total;setRunning(false);startRef.current=null;setLastCue(JIMMY_LIFECYCLE.complete);speakAsJimmyMobile(JIMMY_LIFECYCLE.complete)}},[elapsed,running,total])

 const current=segmentAt(stage,elapsed),progress=Math.min(1,elapsed/Math.max(1,total)),virtualMiles=stage.distanceKm*0.621371*progress
 const next=stage.segments[current.index+1]
 const climbRide=isClimbStage(stage),routeTheme=routeThemeFor(stage)
 const gradientPoints=useMemo(()=>{const raw=stage.profilePoints;if(!raw.length||typeof raw[0]==='string')return [] as {distanceKm:number;elevationM:number}[];return raw as {distanceKm:number;elevationM:number}[]},[stage])
 const courseKm=stage.distanceKm*progress
 const markers=useMemo(()=>{const supplied=stage.officialCourseMarkers??[];const start:OfficialCourseMarker={id:(stage.id??String(stage.number))+'-start',type:'km-zero',routeKm:0,label:'KM 0',verified:true};const finish:OfficialCourseMarker={id:(stage.id??String(stage.number))+'-finish',type:'finish',routeKm:stage.distanceKm,label:'FINISH',verified:true};return [start,...supplied.filter(m=>m.routeKm>0&&m.routeKm<stage.distanceKm),finish]},[stage])
 const profilePoints=useMemo(()=>{const raw=stage.profilePoints;if(!raw.length)return [{x:0,y:.2},{x:.2,y:.35},{x:.4,y:.25},{x:.6,y:.55},{x:.8,y:.4},{x:1,y:.7}];if(typeof raw[0]==='string'){const parsed=raw.map(p=>String(p).split(',').map(Number));const xs=parsed.map(p=>p[0]),ys=parsed.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);return parsed.map(([x,y])=>({x:(x-minX)/Math.max(1,maxX-minX),y:1-(y-minY)/Math.max(1,maxY-minY)}))}const pts=raw as {distanceKm:number;elevationM:number}[];const min=Math.min(...pts.map(p=>p.elevationM)),max=Math.max(...pts.map(p=>p.elevationM));return pts.map(p=>({x:p.distanceKm/Math.max(1,stage.distanceKm),y:.12+((p.elevationM-min)/Math.max(1,max-min))*.78}))},[stage])

 useEffect(()=>{if(!running)return;if(lastSectionRef.current!==current.index){lastSectionRef.current=current.index;const cue=current.index===0?jimmyOpening(current.segment.name,current.segment.description||current.segment.objective||current.segment.name):`${current.segment.name}. ${current.segment.description||current.segment.objective||''}`;setLastCue(cue);speakAsJimmyMobile(cue)}},[running,current.index,current.segment.name,current.segment.description,current.segment.objective])
 useEffect(()=>{if(!running||!next)return;const cue=jimmyTransitionCue(Math.ceil(current.segmentRemaining),next.name,next.zone);if(cue&&lastTransitionRef.current!==cue){lastTransitionRef.current=cue;setLastCue(cue);speakAsJimmyMobile(cue)}},[running,current.segmentRemaining,next])

 const start=()=>{lastSectionRef.current=-1;lastTransitionRef.current='';startRef.current=Date.now();setRunning(true)}
 const pause=()=>{if(!running)return;const active=startRef.current?Math.floor((Date.now()-startRef.current)/1000):0;baseRef.current=Math.min(total,baseRef.current+active);setElapsed(baseRef.current);startRef.current=null;setRunning(false);setLastCue(JIMMY_LIFECYCLE.paused);speakAsJimmyMobile(JIMMY_LIFECYCLE.paused)}
 const resume=()=>{startRef.current=Date.now();setRunning(true);const cue=`Back on. ${current.segment.name}. ${current.segment.description||''}`;setLastCue(cue);speakAsJimmyMobile(cue)}
 const finish=async()=>{if(running)pause();setSaving(true);await onFinish(elapsed);setSaving(false)}

 return <ScrollView contentContainerStyle={s.wrap} stickyHeaderIndices={[]}>
  <View style={s.topbar}><Pressable onPress={onBack}><Text style={s.link}>‹ Briefing</Text></Pressable><Text style={s.stageTag}>STAGE {stage.number}</Text><Text style={s.progressText}>{Math.round(progress*100)}%</Text></View>
  <Text style={s.title}>{stage.route}</Text>
  <View style={s.viewTabs}>
   {(['TARGETS','COURSE','JIMMY'] as const).map(tab=><Pressable key={tab} onPress={()=>setCockpitView(tab)} style={[s.viewTab,cockpitView===tab&&s.viewTabActive]}><Text style={[s.viewTabText,cockpitView===tab&&s.viewTabTextActive]}>{tab}</Text></Pressable>)}
  </View>

  {cockpitView==='TARGETS'&&<View style={s.cockpit}>
   <View style={s.timerRow}><View><Text style={s.label}>STAGE TIME</Text><Text style={s.time}>{formatTime(elapsed)}</Text></View><View style={s.rightTime}><Text style={s.label}>REMAINING</Text><Text style={s.remaining}>{formatTime(Math.max(0,total-elapsed))}</Text><Text style={s.virtual}>{virtualMiles.toFixed(1)} virtual mi</Text></View></View>
   <View style={s.progressTrack}><View style={[s.progressFill,{width:(progress*100)+'%'}]}/></View>

   <View style={s.sectionHead}><View style={s.sectionIcon}><Text style={s.sectionIconText}>{terrainIcon(current.segment.name+' '+current.segment.type+' '+current.segment.terrainLabel)}</Text></View><View style={{flex:1}}><Text style={s.now}>CURRENT · {current.index+1}/{stage.segments.length}</Text><Text style={s.sectionTitle}>{current.segment.name}</Text></View><Text style={s.sectionTime}>{formatTime(current.segmentRemaining)}</Text></View>

   <View style={s.metrics}><Metric label="ZONE" value={current.segment.zone}/><Metric label="POWER" value={current.segment.power}/><Metric label="CADENCE" value={current.segment.cadence}/><Metric label="RESISTANCE" value={current.segment.resistance}/></View>

   <View style={s.nextStrip}><Text style={s.nextLabel}>NEXT</Text><Text style={s.nextTitle}>{next?.name??'Finish line'}</Text><Text style={s.nextTime}>{next?Math.ceil(next.sec/60)+' min':'—'}</Text></View>
  </View>}

  {cockpitView==='JIMMY'&&<View style={s.jimmy}><View style={s.jimmyBadge}><Text style={s.jimmyBadgeText}>J</Text></View><View style={{flex:1}}><Text style={s.jimmyName}>JIMMY RADIO</Text><Text style={s.jimmyText}>{lastCue??current.segment.description??stage.objective}</Text></View></View>

  <Pressable style={s.courseToggle} onPress={()=>setShowCourse(v=>!v)}><Text style={s.courseToggleText}>{showCourse?'HIDE COURSE INTELLIGENCE':'SHOW COURSE INTELLIGENCE'}</Text><Text style={s.courseToggleArrow}>{showCourse?'⌃':'⌄'}</Text></Pressable>
  {showCourse&&<>
   {stage.routeMap?.points?.length?<RouteMapCard points={stage.routeMap.points} progress={progress} alt={stage.routeMap.alt}/>:null}
   {climbRide&&gradientPoints.length>1?<GradientClimbProfile points={gradientPoints} progress={progress}/>:<ImmersiveRideProfile points={profilePoints} progress={progress} label="COURSE PROFILE" currentLabel={current.segment.name} nextLabel={next?.name??'Finish'}/>}
   <CourseMarkerStrip markers={markers} distanceKm={stage.distanceKm} courseKm={courseKm}/>
  </>}

  {cockpitView==='TARGETS'&&<View style={s.contextCard}><Text style={s.label}>RIDE CONTEXT</Text><Text style={s.contextTitle}>{routeTheme.name}</Text><Text style={s.contextText}>{current.segment.description||stage.objective}</Text></View>

  {elapsed===0&&!running&&<Pressable style={s.primary} onPress={start}><Text style={s.primaryText}>START STAGE</Text></Pressable>}
  {running&&<Pressable style={s.warn} onPress={pause}><Text style={s.primaryText}>PAUSE</Text></Pressable>}
  {!running&&elapsed>0&&elapsed<total&&<View style={s.actions}><Pressable style={s.secondary} onPress={resume}><Text style={s.secondaryText}>RESUME</Text></Pressable><Pressable style={s.finish} onPress={finish} disabled={saving}><Text style={s.primaryText}>{saving?'SAVING…':'FINISH'}</Text></Pressable></View>}
  {!running&&elapsed>=total&&<Pressable style={s.finishWide} onPress={finish} disabled={saving}><Text style={s.primaryText}>{saving?'SAVING…':'SAVE STAGE'}</Text></Pressable>}
 </ScrollView>
}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text numberOfLines={2} style={s.metricValue}>{value}</Text></View>}

const s=StyleSheet.create({
 wrap:{padding:16,gap:12,backgroundColor:'#080a0c'},viewTabs:{flexDirection:'row',gap:8},viewTab:{flex:1,paddingVertical:10,borderRadius:12,borderWidth:1,borderColor:'#34383a',alignItems:'center',backgroundColor:'#101214'},viewTabActive:{backgroundColor:'#ff6a00',borderColor:'#ff6a00'},viewTabText:{color:'#8f9396',fontSize:11,fontWeight:'900',letterSpacing:.7},viewTabTextActive:{color:'#111'},topbar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},link:{color:'#ff8b3d',fontWeight:'800'},stageTag:{color:'#8f9396',fontWeight:'900',letterSpacing:1.2,fontSize:11},progressText:{color:'#ff8b3d',fontWeight:'900'},title:{color:'#fff',fontSize:24,fontWeight:'900',marginBottom:2},
 cockpit:{padding:16,borderRadius:22,backgroundColor:'#111315',borderWidth:1,borderColor:'#5b3218',gap:14},timerRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'},label:{color:'#777b7e',fontWeight:'900',letterSpacing:1.1,fontSize:9},time:{color:'#fff',fontSize:45,fontWeight:'900',letterSpacing:-1,lineHeight:49},rightTime:{alignItems:'flex-end'},remaining:{color:'#ff8b3d',fontSize:20,fontWeight:'900'},virtual:{color:'#777b7e',fontSize:10,fontWeight:'800',marginTop:2},progressTrack:{height:5,borderRadius:4,backgroundColor:'#25282a',overflow:'hidden'},progressFill:{height:5,backgroundColor:'#ff6a00'},
 sectionHead:{flexDirection:'row',alignItems:'center',gap:10},sectionIcon:{width:44,height:44,borderRadius:13,backgroundColor:'#2d190e',alignItems:'center',justifyContent:'center'},sectionIconText:{color:'#ff6a00',fontSize:23,fontWeight:'900'},now:{color:'#ff8b3d',fontSize:9,fontWeight:'900',letterSpacing:1},sectionTitle:{color:'#fff',fontSize:22,fontWeight:'900',marginTop:2},sectionTime:{color:'#ff8b3d',fontSize:16,fontWeight:'900'},
 metrics:{flexDirection:'row',flexWrap:'wrap',gap:8},metric:{width:'48.5%',padding:11,borderRadius:12,backgroundColor:'#0b0c0d',minHeight:67},metricLabel:{color:'#777b7e',fontSize:8,fontWeight:'900',letterSpacing:1},metricValue:{color:'#fff',fontSize:16,fontWeight:'900',marginTop:5,lineHeight:18},
 nextStrip:{flexDirection:'row',alignItems:'center',gap:10,paddingTop:2},nextLabel:{color:'#777b7e',fontSize:9,fontWeight:'900',letterSpacing:1},nextTitle:{color:'#fff',fontSize:14,fontWeight:'900',flex:1},nextTime:{color:'#9a9da0',fontSize:11,fontWeight:'800'},
 jimmy:{flexDirection:'row',gap:10,padding:13,borderRadius:16,backgroundColor:'#101010',borderWidth:1,borderColor:'#2f3234'},jimmyBadge:{width:38,height:38,borderRadius:19,backgroundColor:'#ff6a00',alignItems:'center',justifyContent:'center'},jimmyBadgeText:{color:'#111',fontSize:19,fontWeight:'900'},jimmyName:{color:'#ff8b3d',fontSize:9,fontWeight:'900',letterSpacing:1.1},jimmyText:{color:'#d0d0d0',fontSize:15,lineHeight:21,marginTop:5},jimmyContext:{color:'#7e8386',fontSize:11,fontWeight:'800',marginTop:10},
 courseToggle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:13,borderRadius:14,borderWidth:1,borderColor:'#35383a',backgroundColor:'#111315'},courseToggleText:{color:'#fff',fontSize:11,fontWeight:'900',letterSpacing:.8},courseToggleArrow:{color:'#ff8b3d',fontSize:20,fontWeight:'900'},
 contextCard:{padding:13,borderRadius:15,backgroundColor:'#111315',borderWidth:1,borderColor:'#2f3234'},contextTitle:{color:'#fff',fontSize:15,fontWeight:'900',marginTop:3},contextText:{color:'#9d9fa1',fontSize:12,lineHeight:17,marginTop:4},
 primary:{backgroundColor:'#ff6a00',padding:18,borderRadius:16,alignItems:'center'},warn:{backgroundColor:'#d98a00',padding:18,borderRadius:16,alignItems:'center'},finish:{backgroundColor:'#c63b2f',padding:18,borderRadius:16,alignItems:'center',flex:1},finishWide:{backgroundColor:'#c63b2f',padding:18,borderRadius:16,alignItems:'center'},secondary:{borderWidth:1,borderColor:'#555',padding:18,borderRadius:16,alignItems:'center',flex:1},actions:{flexDirection:'row',gap:12},primaryText:{color:'#fff',fontWeight:'900',fontSize:16},secondaryText:{color:'#fff',fontWeight:'800'}
})