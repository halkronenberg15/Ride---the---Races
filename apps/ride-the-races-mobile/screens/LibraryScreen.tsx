import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { curatedOffSeasonTrainingRides, trainingRides, vueltaRideStages } from '../../../src/data/raceLibrary'
import { raceStages, type RaceStage } from '../../../src/data/raceStages'

export default function LibraryScreen({onBack,onOpenStage}:{onBack:()=>void;onOpenStage:(stage:RaceStage)=>void}){
 const [open,setOpen]=useState<'tour'|'vuelta'|'training'|null>('tour')
 const groups=[
  {id:'tour' as const,title:'Tour de France 2026',subtitle:String(raceStages.length)+' created stages',stages:raceStages},
  {id:'vuelta' as const,title:'Vuelta 2026',subtitle:String(vueltaRideStages.length)+' created stages',stages:vueltaRideStages},
  {id:'training' as const,title:'Training & Classic Rides',subtitle:String(trainingRides.length+curatedOffSeasonTrainingRides.length)+' created rides',stages:[...trainingRides.map(r=>r.stage),...curatedOffSeasonTrainingRides.map(r=>r.stage)]},
 ]
 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>TEAM LORIOT</Text><Text style={s.title}>Race Library</Text>
  <Text style={s.body}>Every created RtR stage and training ride lives here. Open a collection, choose the road, then launch the structured cockpit.</Text>
  {groups.map(group=><View key={group.id} style={s.group}>
   <Pressable style={s.groupHead} onPress={()=>setOpen(open===group.id?null:group.id)}>
    <View><Text style={s.groupTitle}>{group.title}</Text><Text style={s.groupSub}>{group.subtitle}</Text></View><Text style={s.chev}>{open===group.id?'⌃':'⌄'}</Text>
   </Pressable>
   {open===group.id&&<View style={s.list}>{group.stages.map((stage,index)=><Pressable key={(stage.id??stage.number)+'-'+index} style={s.card} onPress={()=>onOpenStage(stage)}>
    <View style={s.top}><Text style={s.num}>{stage.isTraining?'RIDE':String(stage.number).padStart(2,'0')}</Text><View style={s.flex}><Text style={s.cardTitle}>{stage.title??stage.route}</Text><Text style={s.meta}>{stage.theme} · {Math.round(stage.segments.reduce((sum,seg)=>sum+seg.sec,0)/60)} min</Text></View><Text style={s.open}>→</Text></View>
   </Pressable>)}</View>}
  </View>)}
 </ScrollView>
}
const s=StyleSheet.create({wrap:{padding:20,gap:14},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2},title:{color:'#fff',fontSize:36,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:15,lineHeight:22},group:{borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',overflow:'hidden'},groupHead:{padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},groupTitle:{color:'#fff',fontWeight:'900',fontSize:18},groupSub:{color:'#8f8f8f',fontSize:13,marginTop:3},chev:{color:'#ff8b3d',fontSize:24,fontWeight:'900'},list:{padding:12,paddingTop:0,gap:8},card:{padding:14,borderRadius:14,backgroundColor:'#101010',borderWidth:1,borderColor:'#292929'},top:{flexDirection:'row',alignItems:'center',gap:12},num:{color:'#ff6a00',fontSize:14,fontWeight:'900',minWidth:38},flex:{flex:1},cardTitle:{color:'#fff',fontSize:15,fontWeight:'800'},meta:{color:'#7f7f7f',fontSize:12,marginTop:3},open:{color:'#ff8b3d',fontWeight:'900',fontSize:22}})