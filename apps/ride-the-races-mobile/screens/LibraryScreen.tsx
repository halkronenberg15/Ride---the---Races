import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { curatedOffSeasonTrainingRides, trainingRides, vueltaRideStages } from '../../../src/data/raceLibrary'
import { raceStages, type RaceStage } from '../../../src/data/raceStages'
import { worldsStages } from '../../../src/data/uciWorlds2026'
import { routeThemes, sourceLabel } from '../lib/routeThemes'

type OpenId=string|null

function minutes(stage:RaceStage){return Math.round(stage.segments.reduce((sum,seg)=>sum+seg.sec,0)/60)}

export default function LibraryScreen({onBack,onOpenStage}:{onBack:()=>void;onOpenStage:(stage:RaceStage)=>void}){
 const [open,setOpen]=useState<OpenId>('theme-alpine')
 const raceGroups=[
  {id:'race-tour',title:'Tour de France 2026',subtitle:String(raceStages.length)+' created stages',stages:raceStages},
  {id:'race-vuelta',title:'Vuelta 2026',subtitle:String(vueltaRideStages.length)+' created stages',stages:vueltaRideStages},
  {id:'race-worlds',title:'World Championships 2026',subtitle:String(worldsStages.length)+' created rides',stages:worldsStages},
  {id:'race-training',title:'Training Rides',subtitle:String(trainingRides.length+curatedOffSeasonTrainingRides.length)+' created rides',stages:[...trainingRides.map(r=>r.stage),...curatedOffSeasonTrainingRides.map(r=>r.stage)]},
 ]
 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>TEAM LORIOT</Text><Text style={s.title}>Ride Catalogue</Text>
  <Text style={s.body}>Browse by the kind of road you want to ride, or open the original race collection. Tour, Vuelta, Worlds and training routes can live together inside the terrain themes that fit them.</Text>

  <View style={s.hero}>
   <Text style={s.heroEyebrow}>ROUTE THEMES</Text>
   <Text style={s.heroTitle}>Pick the road first.</Text>
   <Text style={s.heroBody}>Mountain day, rolling countryside, fast roads or a championship circuit. The catalogue then shows every matching ride we have already built.</Text>
  </View>

  {routeThemes.map(theme=>{
   const id='theme-'+theme.id
   return <View key={id} style={s.group}>
    <Pressable style={s.groupHead} onPress={()=>setOpen(open===id?null:id)}>
     <View style={s.flex}><Text style={s.groupTitle}>{theme.name}</Text><Text style={s.groupSub}>{theme.subtitle}</Text><Text style={s.count}>{theme.stages.length} rides</Text></View><Text style={s.chev}>{open===id?'⌃':'⌄'}</Text>
    </Pressable>
    {open===id&&<View style={s.list}>{theme.stages.map((stage,index)=><RideCard key={(stage.id??stage.number)+'-'+index} stage={stage} onPress={()=>onOpenStage(stage)}/>)}</View>}
   </View>
  })}

  <Text style={s.sectionLabel}>RACE COLLECTIONS</Text>
  {raceGroups.map(group=><View key={group.id} style={s.group}>
   <Pressable style={s.groupHead} onPress={()=>setOpen(open===group.id?null:group.id)}>
    <View><Text style={s.groupTitle}>{group.title}</Text><Text style={s.groupSub}>{group.subtitle}</Text></View><Text style={s.chev}>{open===group.id?'⌃':'⌄'}</Text>
   </Pressable>
   {open===group.id&&<View style={s.list}>{group.stages.map((stage,index)=><RideCard key={(stage.id??stage.number)+'-'+index} stage={stage} onPress={()=>onOpenStage(stage)}/>)}</View>}
  </View>)}
 </ScrollView>
}

function RideCard({stage,onPress}:{stage:RaceStage;onPress:()=>void}){
 return <Pressable style={s.card} onPress={onPress}>
  <View style={s.top}>
   <View style={s.source}><Text style={s.sourceText}>{sourceLabel(stage)}</Text></View>
   <View style={s.flex}><Text style={s.cardTitle}>{stage.title??stage.route}</Text><Text style={s.meta}>{stage.theme} · {minutes(stage)} min · {Math.round(stage.distanceKm*0.621371)} mi</Text></View>
   <Text style={s.open}>→</Text>
  </View>
  {stage.elevationM>0&&<Text style={s.elev}>{stage.elevationM.toLocaleString()} m climbing</Text>}
 </Pressable>
}

const s=StyleSheet.create({
 wrap:{padding:20,gap:14},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2},title:{color:'#fff',fontSize:36,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:15,lineHeight:22},
 hero:{padding:18,borderRadius:20,backgroundColor:'#19120d',borderWidth:1,borderColor:'#633412',gap:5},heroEyebrow:{color:'#ff8b3d',fontSize:10,fontWeight:'900',letterSpacing:1.5},heroTitle:{color:'#fff',fontSize:24,fontWeight:'900'},heroBody:{color:'#aaa',fontSize:14,lineHeight:20},
 sectionLabel:{color:'#7d7d7d',fontSize:11,fontWeight:'900',letterSpacing:1.4,marginTop:8},
 group:{borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',overflow:'hidden'},groupHead:{padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},groupTitle:{color:'#fff',fontWeight:'900',fontSize:18},groupSub:{color:'#8f8f8f',fontSize:13,marginTop:3,lineHeight:18},count:{color:'#ff8b3d',fontSize:11,fontWeight:'900',marginTop:5},chev:{color:'#ff8b3d',fontSize:24,fontWeight:'900'},list:{padding:12,paddingTop:0,gap:8},
 card:{padding:14,borderRadius:14,backgroundColor:'#101010',borderWidth:1,borderColor:'#292929'},top:{flexDirection:'row',alignItems:'center',gap:10},source:{paddingVertical:5,paddingHorizontal:7,borderRadius:7,backgroundColor:'#222'},sourceText:{color:'#ff8b3d',fontSize:9,fontWeight:'900',letterSpacing:.5},flex:{flex:1},cardTitle:{color:'#fff',fontSize:15,fontWeight:'800'},meta:{color:'#7f7f7f',fontSize:12,marginTop:3},open:{color:'#ff8b3d',fontWeight:'900',fontSize:22},elev:{color:'#a0a0a0',fontSize:11,fontWeight:'700',marginTop:8,marginLeft:58}
})