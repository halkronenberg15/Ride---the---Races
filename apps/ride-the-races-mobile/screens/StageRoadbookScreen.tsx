import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { raceStages, type RaceStage } from '../../../src/data/raceStages'

function minutes(stage:RaceStage){return Math.round(stage.segments.reduce((sum,s)=>sum+s.sec,0)/60)}

export default function StageRoadbookScreen({onBack,onOpenStage}:{onBack:()=>void;onOpenStage:(stage:RaceStage)=>void}){
 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Race Library</Text></Pressable>
  <Text style={s.eyebrow}>TOUR DE FRANCE 2026</Text><Text style={s.title}>Stage Roadbook</Text>
  <Text style={s.body}>Choose a stage to open its route profile, targets and structured indoor cockpit.</Text>
  {raceStages.map(stage=><Pressable key={stage.number} style={s.card} onPress={()=>onOpenStage(stage)}>
   <View style={s.top}><Text style={s.num}>{String(stage.number).padStart(2,'0')}</Text><View style={s.flex}><Text style={s.cardTitle}>{stage.route}</Text><Text style={s.body}>{stage.theme} · {minutes(stage)} min</Text></View><Text style={s.open}>Open →</Text></View>
   <Text style={s.meta}>{stage.distanceKm.toFixed(1)} km · {Math.round(stage.distanceKm*0.621371)} mi · {stage.elevationM.toLocaleString()} m D+</Text>
  </Pressable>)}
 </ScrollView>
}
const s=StyleSheet.create({wrap:{padding:20,gap:12},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2},title:{color:'#fff',fontSize:36,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:15,lineHeight:22},card:{padding:16,borderRadius:16,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:8},top:{flexDirection:'row',alignItems:'center',gap:12},num:{color:'#ff6a00',fontSize:24,fontWeight:'900'},flex:{flex:1},cardTitle:{color:'#fff',fontSize:17,fontWeight:'800'},open:{color:'#ff8b3d',fontWeight:'800'},meta:{color:'#878787',fontSize:13,fontWeight:'700'}})
