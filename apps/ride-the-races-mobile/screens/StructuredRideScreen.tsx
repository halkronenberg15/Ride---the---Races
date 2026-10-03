import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import ImmersiveRideProfile from '../components/ImmersiveRideProfile'
import GradientClimbProfile from '../components/GradientClimbProfile'
import RouteMapCard from '../components/RouteMapCard'
import CourseMarkerStrip from '../components/CourseMarkerStrip'
import RoadAheadCard from '../components/RoadAheadCard'
import { isClimbStage, routeThemeFor } from '../lib/routeThemes'
import type { OfficialCourseMarker } from '../../../src/data/courseMarkers'
import type { RaceStage } from '../../../src/data/raceStages'

function formatTime(seconds:number){const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return [h,m,s].map((v,i)=>i===0?String(v):String(v).padStart(2,'0')).join(':')}
function segmentAt(stage:RaceStage,elapsed:number){let cursor=0;for(let i=0;i<stage.segments.length;i++){const seg=stage.segments[i];if(elapsed<cursor+seg.sec)return {segment:seg,index:i,segmentElapsed:elapsed-cursor,segmentRemaining:cursor+seg.sec-elapsed};cursor+=seg.sec}return {segment:stage.segments[stage.segments.length-1],index:stage.segments.length-1,segmentElapsed:0,segmentRemaining:0}}

export default function StructuredRideScreen({stage,onBack,onFinish}:{stage:RaceStage;onBack:()=>void;onFinish:(durationSeconds:number)=>Promise<void>}){
 const total=useMemo(()=>stage.segments.reduce((sum,s)=>sum+s.sec,0),[stage])
 const [elapsed,setElapsed]=useState(0),[running,setRunning]=useState(false),[saving,setSaving]=useState(false)
 const startRef=useRef<number|null>(null),baseRef=useRef(0)
 useEffect(()=>{if(!running)return;const id=setInterval(()=>{const active=startRef.current?Math.floor((Date.now()-startRef.current)/1000):0;setElapsed(Math.min(total,baseRef.current+active))},500);return()=>clearInterval(id)},[running,total])
 useEffect(()=>{if(elapsed>=total&&running){baseRef.current=total;setRunning(false);startRef.current=null}},[elapsed,running,total])
 const current=segmentAt(stage,elapsed),progress=Math.min(1,elapsed/Math.max(1,total)),virtualMiles=stage.distanceKm*0.621371*progress
 const climbRide=isClimbStage(stage)
 const routeTheme=routeThemeFor(stage)
 const gradientPoints=useMemo(()=>{const raw=stage.profilePoints;if(!raw.length||typeof raw[0]==='string')return [] as {distanceKm:number;elevationM:number}[];return raw as {distanceKm:number;elevationM:number}[]},[stage])
 const courseKm=stage.distanceKm*progress
 const markers=useMemo(()=>{const supplied=stage.officialCourseMarkers??[];const start:OfficialCourseMarker={id:(stage.id??String(stage.number))+'-start',type:'km-zero',routeKm:0,label:'KM 0',verified:true};const finish:OfficialCourseMarker={id:(stage.id??String(stage.number))+'-finish',type:'finish',routeKm:stage.distanceKm,label:'FINISH',verified:true};return [start,...supplied.filter(m=>m.routeKm>0&&m.routeKm<stage.distanceKm),finish]},[stage])
 const profilePoints=useMemo(()=>{const raw=stage.profilePoints;if(!raw.length)return [{x:0,y:.2},{x:.2,y:.35},{x:.4,y:.25},{x:.6,y:.55},{x:.8,y:.4},{x:1,y:.7}];if(typeof raw[0]==='string'){const parsed=raw.map(p=>String(p).split(',').map(Number));const xs=parsed.map(p=>p[0]),ys=parsed.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);return parsed.map(([x,y])=>({x:(x-minX)/Math.max(1,maxX-minX),y:1-(y-minY)/Math.max(1,maxY-minY)}))}const pts=raw as {distanceKm:number;elevationM:number}[];const min=Math.min(...pts.map(p=>p.elevationM)),max=Math.max(...pts.map(p=>p.elevationM));return pts.map(p=>({x:p.distanceKm/Math.max(1,stage.distanceKm),y:.12+((p.elevationM-min)/Math.max(1,max-min))*.78}))},[stage])
 const start=()=>{startRef.current=Date.now();setRunning(true)}
 const pause=()=>{if(!running)return;const active=startRef.current?Math.floor((Date.now()-startRef.current)/1000):0;baseRef.current=Math.min(total,baseRef.current+active);setElapsed(baseRef.current);startRef.current=null;setRunning(false)}
 const resume=()=>{startRef.current=Date.now();setRunning(true)}
 const finish=async()=>{pause();setSaving(true);await onFinish(elapsed);setSaving(false)}
 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Stage Roadbook</Text></Pressable>
  <Text style={s.eyebrow}>STAGE {stage.number} · {stage.theme.toUpperCase()}</Text><Text style={s.title}>{stage.route}</Text>
  <Text style={s.theme}>{routeTheme.name}</Text>
  <Text style={s.body}>{stage.objective}</Text>

  {stage.routeMap?.points?.length?<RouteMapCard points={stage.routeMap.points} progress={progress} alt={stage.routeMap.alt}/>:null}

  {climbRide&&gradientPoints.length>1
   ? <GradientClimbProfile points={gradientPoints} progress={progress}/>
   : <ImmersiveRideProfile points={profilePoints} progress={progress} label="COURSE PROFILE" currentLabel={current.segment.name} nextLabel={stage.segments[current.index+1]?.name??'Finish'}/>}

  <CourseMarkerStrip markers={markers} distanceKm={stage.distanceKm} courseKm={courseKm}/>
  <RoadAheadCard current={current.segment} next={stage.segments[current.index+1]} remaining={current.segmentRemaining}/>

  <View style={s.timeCard}><Text style={s.label}>STAGE TIME</Text><Text style={s.time}>{formatTime(elapsed)}</Text><Text style={s.subtle}>{formatTime(Math.max(0,total-elapsed))} remaining · {virtualMiles.toFixed(1)} virtual mi</Text></View>

  <View style={s.segmentCard}><View style={s.segmentTop}><Text style={s.label}>CURRENT SECTION {current.index+1}/{stage.segments.length}</Text><Text style={s.orange}>{formatTime(current.segmentRemaining)}</Text></View><Text style={s.segmentTitle}>{current.segment.name}</Text><Text style={s.body}>{current.segment.description}</Text>
   <View style={s.grid}><Metric label="ZONE" value={current.segment.zone}/><Metric label="POWER" value={current.segment.power}/><Metric label="CADENCE" value={current.segment.cadence}/><Metric label="RESISTANCE" value={current.segment.resistance}/></View>
  </View>

  <View style={s.nextCard}><Text style={s.label}>NEXT</Text><Text style={s.next}>{stage.segments[current.index+1]?.name??'Finish line'}</Text></View>

  {elapsed===0&&!running&&<Pressable style={s.primary} onPress={start}><Text style={s.primaryText}>START STAGE</Text></Pressable>}
  {running&&<Pressable style={s.warn} onPress={pause}><Text style={s.primaryText}>PAUSE</Text></Pressable>}
  {!running&&elapsed>0&&elapsed<total&&<View style={s.actions}><Pressable style={s.secondary} onPress={resume}><Text style={s.secondaryText}>RESUME</Text></Pressable><Pressable style={s.finish} onPress={finish} disabled={saving}><Text style={s.primaryText}>{saving?'SAVING…':'FINISH'}</Text></Pressable></View>}
  {!running&&elapsed>=total&&<Pressable style={s.finishWide} onPress={finish} disabled={saving}><Text style={s.primaryText}>{saving?'SAVING…':'SAVE STAGE'}</Text></Pressable>}
 </ScrollView>
}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.label}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>}
const s=StyleSheet.create({wrap:{padding:20,gap:16},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:1.5},title:{color:'#fff',fontSize:34,fontWeight:'900'},theme:{color:'#ff8b3d',fontSize:13,fontWeight:'900',letterSpacing:.8},body:{color:'#b8b8b8',fontSize:15,lineHeight:21},profileCard:{padding:16,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:12},profile:{height:90,flexDirection:'row',alignItems:'flex-end',gap:2,overflow:'hidden'},profileBar:{flex:1,backgroundColor:'#ff6a00',borderTopLeftRadius:3,borderTopRightRadius:3},profileMeta:{flexDirection:'row',justifyContent:'space-between',gap:8},meta:{color:'#999',fontSize:12,fontWeight:'700'},timeCard:{padding:20,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535'},label:{color:'#858585',fontWeight:'800',letterSpacing:1,fontSize:11},time:{color:'#fff',fontSize:50,fontWeight:'900',letterSpacing:-1},subtle:{color:'#8f8f8f',fontSize:13,fontWeight:'700'},segmentCard:{padding:18,borderRadius:18,backgroundColor:'#17120f',borderWidth:1,borderColor:'#64300f',gap:9},segmentTop:{flexDirection:'row',justifyContent:'space-between'},orange:{color:'#ff8b3d',fontWeight:'900'},segmentTitle:{color:'#fff',fontSize:25,fontWeight:'900'},grid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:4},metric:{width:'47%',padding:12,borderRadius:12,backgroundColor:'#101010',gap:4},metricValue:{color:'#fff',fontSize:16,fontWeight:'800'},nextCard:{padding:14,borderRadius:14,backgroundColor:'#111',borderWidth:1,borderColor:'#2d2d2d'},next:{color:'#fff',fontSize:16,fontWeight:'800',marginTop:4},primary:{backgroundColor:'#ff6a00',padding:18,borderRadius:16,alignItems:'center'},warn:{backgroundColor:'#d98a00',padding:18,borderRadius:16,alignItems:'center'},finish:{backgroundColor:'#c63b2f',padding:18,borderRadius:16,alignItems:'center',flex:1},finishWide:{backgroundColor:'#c63b2f',padding:18,borderRadius:16,alignItems:'center'},secondary:{borderWidth:1,borderColor:'#555',padding:18,borderRadius:16,alignItems:'center',flex:1},actions:{flexDirection:'row',gap:12},primaryText:{color:'#fff',fontWeight:'900',fontSize:16},secondaryText:{color:'#fff',fontWeight:'800'}})
