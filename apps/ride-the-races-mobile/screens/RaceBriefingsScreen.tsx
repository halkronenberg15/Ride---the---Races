import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { RaceStage } from '../../../src/data/raceStages'

type Panel='stage'|'wind'|'final'|'climb'|'notes'|null
function minutes(stage:RaceStage){return Math.round(stage.segments.reduce((sum,seg)=>sum+seg.sec,0)/60)}
function kmToMi(km:number){return Math.round(km*0.621371)}

export default function RaceBriefingsScreen({stage,onBack,onStart}:{stage:RaceStage;onBack:()=>void;onStart:()=>void}){
 const [panel,setPanel]=useState<Panel>(null)
 const climb=Math.round(stage.elevationM||0),duration=minutes(stage)
 const finalSegments=useMemo(()=>stage.segments.slice(-3),[stage])
 const climbSegments=useMemo(()=>stage.segments.filter(seg=>/climb|mountain|summit|col |category|ascent/i.test([seg.name,seg.type,seg.terrainLabel].join(' '))).slice(0,5),[stage])
 const panelCopy:Record<Exclude<Panel,null>,{title:string;body:string;lines:string[]}>={
  stage:{title:'STAGE PLAN',body:stage.objective||'Ride the stage with control and follow the section targets.',lines:[...stage.teamOrders.slice(0,3),`${stage.segments.length} timed sections · ${duration} min simulated ride`,`${kmToMi(stage.distanceKm)} mi · ${climb.toLocaleString()} m climbing`]},
  wind:{title:'WIND',body:'No verified live wind feed is loaded for this stage briefing yet.',lines:['Use the current weather at ride time before treating wind as tactical data.','Headwind: stay patient and protect effort.','Crosswind: expect higher variability and avoid chasing unnecessary spikes.']},
  final:{title:'FINAL KM',body:'The closing sequence is built from the final authored stage sections.',lines:finalSegments.map(seg=>`${seg.name}: ${seg.description||seg.objective||seg.type}`)},
  climb:{title:'CLIMB VIEW',body:climbSegments.length?'Key climbing sections identified from the authored route.':'No major climbing section is tagged in this stage.',lines:(climbSegments.length?climbSegments:stage.segments.slice(0,3)).map(seg=>`${seg.name}: ${seg.power} · ${seg.cadence}`)},
  notes:{title:'RACE NOTES',body:'Execution reminders for this ride.',lines:['Fuel to the duration and workload, not the race fantasy.','Follow the prescribed target before chasing resistance.','Use Jimmy cues as guidance, not permission to turn every rise into an attack.']}
 }
 const toggle=(next:Exclude<Panel,null>)=>setPanel(current=>current===next?null:next)

 return <ScrollView contentContainerStyle={s.wrap}>
  <View style={s.header}><Pressable onPress={onBack}><Text style={s.back}>‹ Race Library</Text></Pressable><Text style={s.team}>TEAM</Text><Text style={s.logo}>// LORIOT</Text><Text style={s.kicker}>RACE BRIEFINGS</Text></View>

  <View style={s.hero}>
   <View><Text style={s.stage}>STAGE {stage.number}</Text><Text style={s.route}>{stage.title??stage.route}</Text></View>
   <View style={s.heroMetrics}><Metric label="DISTANCE" value={kmToMi(stage.distanceKm)+' mi'}/><Metric label="CLIMBING" value={climb.toLocaleString()+' m'}/><Metric label="RIDE TIME" value={duration+' min'}/></View>
   <View style={s.routeGraphic}><View style={s.routeLine}/><View style={[s.routeLine,{transform:[{rotate:'8deg'}],top:52}]}/><Text style={s.finish}>⚑ FINAL</Text></View>
  </View>

  <Text style={s.section}>ROUTE INTELLIGENCE</Text>
  <View style={s.grid}>
   <Card active={panel==='stage'} icon="⌁" title="STAGE PLAN" sub="Overview · Profile · Key points" onPress={()=>toggle('stage')}/>
   <Card active={panel==='wind'} icon="≈" title="WIND" sub="Direction · Strength · Impact" onPress={()=>toggle('wind')}/>
   <Card active={panel==='final'} icon="↵" title="FINAL KM" sub="Turns · Hazards · Positioning" onPress={()=>toggle('final')}/>
   <Card active={panel==='climb'} icon="△" title="CLIMB VIEW" sub="Gradients · Length · Strategy" onPress={()=>toggle('climb')}/>
  </View>
  <Pressable style={[s.notes,panel==='notes'&&s.active]} onPress={()=>toggle('notes')}><Text style={s.notesIcon}>▤</Text><View style={{flex:1}}><Text style={s.cardTitle}>RACE NOTES</Text><Text style={s.cardSub}>Tactics · Reminders · Fueling · Updates</Text></View><Text style={s.arrow}>{panel==='notes'?'⌃':'›'}</Text></Pressable>

  {panel&&<View style={s.detailPanel}>
   <View style={s.detailTop}><Text style={s.detailTitle}>{panelCopy[panel].title}</Text><Pressable onPress={()=>setPanel(null)}><Text style={s.close}>×</Text></Pressable></View>
   <Text style={s.detailBody}>{panelCopy[panel].body}</Text>
   {panelCopy[panel].lines.map((line,i)=><View key={i} style={s.detailRow}><Text style={s.bullet}>•</Text><Text style={s.detailLine}>{line}</Text></View>)}
  </View>}

  <Pressable style={s.start} onPress={onStart}><Text style={s.startSmall}>COCKPIT READY</Text><Text style={s.startTitle}>START THIS STAGE</Text><Text style={s.startArrow}>›</Text></Pressable>
 </ScrollView>
}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>}
function Card({icon,title,sub,onPress,active}:{icon:string;title:string;sub:string;onPress:()=>void;active:boolean}){return <Pressable style={[s.card,active&&s.active]} onPress={onPress}><View style={s.cardArt}><Text style={s.cardIcon}>{icon}</Text><View style={s.cardRoute}/></View><Text style={s.cardTitle}>{title}</Text><Text style={s.cardSub}>{sub}</Text><Text style={s.arrow}>{active?'⌃':'›'}</Text></Pressable>}

const s=StyleSheet.create({
 wrap:{padding:18,gap:14,backgroundColor:'#080a0c'},header:{alignItems:'flex-start'},back:{color:'#ff8b3d',fontWeight:'800',marginBottom:8},team:{color:'#ff6a00',fontSize:9,fontWeight:'900',letterSpacing:5,marginLeft:38},logo:{color:'#fff',fontSize:32,fontWeight:'900',fontStyle:'italic'},kicker:{color:'#a9abad',fontSize:10,fontWeight:'900',letterSpacing:4,marginLeft:39},
 hero:{padding:18,borderRadius:24,backgroundColor:'#141619',borderWidth:1,borderColor:'#49301f',gap:14},stage:{color:'#ff8b3d',fontSize:11,fontWeight:'900',letterSpacing:1.2},route:{color:'#fff',fontSize:24,fontWeight:'900',marginTop:3},heroMetrics:{flexDirection:'row',gap:8},metric:{flex:1,padding:11,borderRadius:12,backgroundColor:'#101214'},metricLabel:{color:'#777b7e',fontSize:8,fontWeight:'900',letterSpacing:1},metricValue:{color:'#fff',fontSize:14,fontWeight:'900',marginTop:3},routeGraphic:{height:90,borderRadius:14,backgroundColor:'#18252a',overflow:'hidden',position:'relative'},routeLine:{position:'absolute',left:18,right:18,top:42,height:5,backgroundColor:'#ff6a00',transform:[{rotate:'-7deg'}]},finish:{position:'absolute',right:12,top:10,color:'#fff',fontSize:10,fontWeight:'900'},
 section:{color:'#fff',fontSize:22,fontWeight:'900',fontStyle:'italic',marginTop:4},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},card:{width:'48.5%',minHeight:145,borderRadius:17,backgroundColor:'#121416',borderWidth:1,borderColor:'#303335',overflow:'hidden',paddingBottom:12,position:'relative'},active:{borderColor:'#ff6a00',backgroundColor:'#17110d'},cardArt:{height:72,backgroundColor:'#1a2225',justifyContent:'center',paddingLeft:15,overflow:'hidden'},cardIcon:{color:'#ff6a00',fontSize:30,fontWeight:'900'},cardRoute:{position:'absolute',left:55,right:-10,top:35,height:3,backgroundColor:'#ff6a00',transform:[{rotate:'-12deg'}]},cardTitle:{color:'#fff',fontSize:14,fontWeight:'900',marginTop:10,marginHorizontal:12},cardSub:{color:'#85898c',fontSize:10,lineHeight:14,marginHorizontal:12,marginTop:2,paddingRight:15},arrow:{position:'absolute',right:10,bottom:16,color:'#fff',fontSize:24},
 notes:{height:78,borderRadius:17,backgroundColor:'#121416',borderWidth:1,borderColor:'#303335',flexDirection:'row',alignItems:'center',padding:14,gap:12,position:'relative'},notesIcon:{color:'#ff6a00',fontSize:30,fontWeight:'900'},detailPanel:{padding:16,borderRadius:18,backgroundColor:'#111315',borderWidth:1,borderColor:'#ff6a00',gap:9},detailTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},detailTitle:{color:'#fff',fontSize:19,fontWeight:'900'},close:{color:'#ff8b3d',fontSize:28,fontWeight:'900'},detailBody:{color:'#b9b9b9',fontSize:14,lineHeight:20},detailRow:{flexDirection:'row',gap:8},bullet:{color:'#ff6a00',fontSize:16,fontWeight:'900'},detailLine:{color:'#e0e0e0',fontSize:13,lineHeight:19,flex:1},
 start:{padding:18,borderRadius:20,backgroundColor:'#ff6a00',position:'relative'},startSmall:{color:'#4b2109',fontSize:9,fontWeight:'900',letterSpacing:1.4},startTitle:{color:'#0b0b0b',fontSize:20,fontWeight:'900',marginTop:2},startArrow:{position:'absolute',right:18,top:15,color:'#0b0b0b',fontSize:38,fontWeight:'900'}
})