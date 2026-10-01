import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'

export default function HistoryScreen({career,onBack}:{career:CloudCareerSnapshot|null;onBack:()=>void}){
 const rides=[...(career?.rideHistory??[])].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30)
 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>RIDE DATA</Text><Text style={s.title}>Ride History</Text>
  <Text style={s.body}>{career?.rideHistory.length??0} imported historical rides</Text>
  {rides.map(ride=>{
   const label=ride.workoutId??ride.source??'Ride'
   const detail=String(Math.round(ride.durationMinutes))+' min · '+String((ride.distanceKm*0.621371).toFixed(1))+' mi'+(ride.averagePower?' · '+String(Math.round(ride.averagePower))+' W':'')
   return <View key={ride.id} style={s.card}><View style={s.top}><Text style={s.cardTitle}>{label}</Text><Text style={s.date}>{ride.date.slice(0,10)}</Text></View><Text style={s.body}>{detail}</Text></View>
  })}
 </ScrollView>
}
const s=StyleSheet.create({wrap:{padding:20,gap:12},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2},title:{color:'#fff',fontSize:36,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:16,lineHeight:23},card:{padding:16,borderRadius:16,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:6},top:{flexDirection:'row',justifyContent:'space-between',gap:12},cardTitle:{color:'#fff',fontWeight:'800',fontSize:16,flex:1},date:{color:'#858585',fontWeight:'700',fontSize:12}})
