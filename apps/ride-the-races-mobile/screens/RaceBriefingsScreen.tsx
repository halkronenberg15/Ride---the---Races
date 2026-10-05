import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { RaceStage } from '../../../src/data/raceStages'

function minutes(stage:RaceStage){return Math.round(stage.segments.reduce((sum,seg)=>sum+seg.sec,0)/60)}

export default function RaceBriefingsScreen({stage,onBack,onStart}:{stage:RaceStage;onBack:()=>void;onStart:()=>void}){
 const climb=Math.round(stage.elevationM||0),duration=minutes(stage)
 return <ScrollView contentContainerStyle={s.wrap}>
  <View style={s.header}><Pressable onPress={onBack}><Text style={s.back}>‹ Race Library</Text></Pressable><Text style={s.team}>TEAM</Text><Text style={s.logo}>// LORIOT</Text><Text style={s.kicker}>RACE BRIEFINGS</Text></View>

  <View style={s.briefing}>
   <View style={s.screen}>
    <View style={s.screenTop}><View><Text style={s.stage}>STAGE {stage.number}</Text><Text style={s.route}>{stage.title??stage.route}</Text></View><Text style={s.distance}>{Math.round(stage.distanceKm*0.621371)} MI</Text></View>
    <View style={s.map}>
     <View style={[s.routeLine,{transform:[{rotate:'-8deg'}]}]}/>
     <View style={[s.routeLine2,{transform:[{rotate:'12deg'}]}]}/>
     <View style={[s.pin,{left:'8%',bottom:'26%'}]}/><View style={[s.pin,{left:'42%',bottom:'47%'}]}/><View style={[s.pin,{right:'8%',top:'18%'}]}/>
     <Text style={s.finish}>⚑ FINAL</Text>
    </View>
    <View style={s.profile}><View style={[s.profileBar,{height:18}]}/><View style={[s.profileBar,{height:31}]}/><View style={[s.profileBar,{height:22}]}/><View style={[s.profileBar,{height:45}]}/><View style={[s.profileBar,{height:30}]}/><View style={[s.profileBar,{height:55}]}/></View>
   </View>
   <View style={s.riders}>{[1,2,3,4].map(x=><View key={x} style={s.rider}><View style={s.head}/><View style={s.shoulders}/></View>)}</View>
   <View style={s.director}><View style={s.directorHead}/><View style={s.directorBody}/><View style={s.arm}/></View>
  </View>

  <View style={s.metrics}><Metric label="DISTANCE" value={Math.round(stage.distanceKm*0.621371)+' mi'}/><Metric label="CLIMBING" value={climb.toLocaleString()+' m'}/><Metric label="RIDE TIME" value={duration+' min'}/></View>

  <Text style={s.section}>ROUTE INTELLIGENCE</Text>
  <View style={s.grid}>
   <Card icon="⌁" title="STAGE PLAN" sub="Overview · Profile · Key points"/>
   <Card icon="≈" title="WIND" sub="Direction · Strength · Impact"/>
   <Card icon="↵" title="FINAL KM" sub="Turns · Hazards · Positioning"/>
   <Card icon="△" title="CLIMB VIEW" sub="Gradients · Length · Strategy"/>
  </View>
  <View style={s.notes}><Text style={s.notesIcon}>▤</Text><View style={{flex:1}}><Text style={s.cardTitle}>RACE NOTES</Text><Text style={s.cardSub}>Tactics · Reminders · Fueling · Updates</Text></View><Text style={s.arrow}>›</Text></View>

  <Pressable style={s.start} onPress={onStart}><Text style={s.startSmall}>COCKPIT READY</Text><Text style={s.startTitle}>START THIS STAGE</Text><Text style={s.startArrow}>›</Text></Pressable>
 </ScrollView>
}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>}
function Card({icon,title,sub}:{icon:string;title:string;sub:string}){return <View style={s.card}><View style={s.cardArt}><Text style={s.cardIcon}>{icon}</Text><View style={s.cardRoute}/></View><Text style={s.cardTitle}>{title}</Text><Text style={s.cardSub}>{sub}</Text><Text style={s.arrow}>›</Text></View>}

const s=StyleSheet.create({
 wrap:{padding:18,gap:14,backgroundColor:'#080a0c'},header:{alignItems:'flex-start'},back:{color:'#ff8b3d',fontWeight:'800',marginBottom:8},team:{color:'#ff6a00',fontSize:9,fontWeight:'900',letterSpacing:5,marginLeft:38},logo:{color:'#fff',fontSize:32,fontWeight:'900',fontStyle:'italic'},kicker:{color:'#a9abad',fontSize:10,fontWeight:'900',letterSpacing:4,marginLeft:39},
 briefing:{height:300,borderRadius:24,backgroundColor:'#141619',borderWidth:1,borderColor:'#49301f',overflow:'hidden',position:'relative'},screen:{position:'absolute',top:16,left:70,right:16,height:174,borderRadius:10,backgroundColor:'#050607',borderWidth:2,borderColor:'#3c4145',padding:10},screenTop:{flexDirection:'row',justifyContent:'space-between'},stage:{color:'#ff8b3d',fontSize:9,fontWeight:'900',letterSpacing:1},route:{color:'#fff',fontSize:12,fontWeight:'900',maxWidth:180},distance:{color:'#fff',fontWeight:'900'},map:{height:80,marginTop:7,backgroundColor:'#18252a',borderRadius:6,overflow:'hidden',position:'relative'},routeLine:{position:'absolute',left:5,right:5,top:40,height:4,backgroundColor:'#ff6a00'},routeLine2:{position:'absolute',left:45,right:15,top:25,height:4,backgroundColor:'#ff6a00'},pin:{position:'absolute',width:10,height:10,borderRadius:5,backgroundColor:'#fff',borderWidth:3,borderColor:'#ff6a00'},finish:{position:'absolute',right:5,top:5,color:'#fff',fontSize:8,fontWeight:'900'},profile:{height:35,flexDirection:'row',alignItems:'flex-end',gap:3,paddingHorizontal:8},profileBar:{flex:1,backgroundColor:'#ff6a00',opacity:.75},
 riders:{position:'absolute',left:20,right:20,bottom:5,flexDirection:'row',justifyContent:'space-between'},rider:{alignItems:'center'},head:{width:25,height:25,borderRadius:13,backgroundColor:'#b4876c'},shoulders:{width:58,height:45,borderTopLeftRadius:18,borderTopRightRadius:18,backgroundColor:'#151515',borderTopWidth:4,borderColor:'#ff6a00'},director:{position:'absolute',left:18,top:65},directorHead:{width:27,height:27,borderRadius:14,backgroundColor:'#c29677'},directorBody:{width:44,height:86,borderRadius:10,backgroundColor:'#0a0a0a',borderLeftWidth:4,borderColor:'#ff6a00'},arm:{position:'absolute',left:32,top:39,width:62,height:8,backgroundColor:'#0a0a0a',transform:[{rotate:'-18deg'}]},
 metrics:{flexDirection:'row',gap:8},metric:{flex:1,padding:12,borderRadius:14,backgroundColor:'#121416',borderWidth:1,borderColor:'#2d3032'},metricLabel:{color:'#777b7e',fontSize:8,fontWeight:'900',letterSpacing:1},metricValue:{color:'#fff',fontSize:14,fontWeight:'900',marginTop:3},section:{color:'#fff',fontSize:22,fontWeight:'900',fontStyle:'italic',marginTop:4},
 grid:{flexDirection:'row',flexWrap:'wrap',gap:10},card:{width:'48.5%',minHeight:145,borderRadius:17,backgroundColor:'#121416',borderWidth:1,borderColor:'#303335',overflow:'hidden',paddingBottom:12,position:'relative'},cardArt:{height:72,backgroundColor:'#1a2225',justifyContent:'center',paddingLeft:15,overflow:'hidden'},cardIcon:{color:'#ff6a00',fontSize:30,fontWeight:'900'},cardRoute:{position:'absolute',left:55,right:-10,top:35,height:3,backgroundColor:'#ff6a00',transform:[{rotate:'-12deg'}]},cardTitle:{color:'#fff',fontSize:14,fontWeight:'900',marginTop:10,marginHorizontal:12},cardSub:{color:'#85898c',fontSize:10,lineHeight:14,marginHorizontal:12,marginTop:2,paddingRight:15},arrow:{position:'absolute',right:10,bottom:16,color:'#fff',fontSize:24},
 notes:{height:78,borderRadius:17,backgroundColor:'#121416',borderWidth:1,borderColor:'#303335',flexDirection:'row',alignItems:'center',padding:14,gap:12,position:'relative'},notesIcon:{color:'#ff6a00',fontSize:30,fontWeight:'900'},start:{padding:18,borderRadius:20,backgroundColor:'#ff6a00',position:'relative'},startSmall:{color:'#4b2109',fontSize:9,fontWeight:'900',letterSpacing:1.4},startTitle:{color:'#0b0b0b',fontSize:20,fontWeight:'900',marginTop:2},startArrow:{position:'absolute',right:18,top:15,color:'#0b0b0b',fontSize:38,fontWeight:'900'}
})