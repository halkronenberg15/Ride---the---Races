import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'

export default function ProfileScreen({career,rideCount,onBack}:{career:CloudCareerSnapshot|null;rideCount:number;onBack:()=>void}){
 const rider=career?.rider
 const weight=rider?.weightKg?String((rider.weightKg*2.20462).toFixed(1))+' lb':'—'
 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>RIDER PASSPORT</Text>
  <Text style={s.title}>{rider?.name??'Rider'}</Text>
  <View style={s.grid}>
   <View style={s.card}><Text style={s.label}>FTP</Text><Text style={s.value}>{rider?.ftp??'—'} W</Text></View>
   <View style={s.card}><Text style={s.label}>CLOUD RIDES</Text><Text style={s.value}>{rideCount}</Text></View>
  </View>
  <View style={s.card}>
   <Text style={s.label}>ARCHETYPE</Text><Text style={s.cardTitle}>{rider?.archetype??'—'}</Text>
   <Text style={s.body}>Goal: {rider?.seasonGoal??'—'}</Text><Text style={s.body}>Imported weight: {weight}</Text>
  </View>
 </ScrollView>
}
const s=StyleSheet.create({wrap:{padding:20,gap:16},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2},title:{color:'#fff',fontSize:36,fontWeight:'900'},grid:{flexDirection:'row',gap:12},card:{flex:1,padding:18,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:8},label:{color:'#858585',fontWeight:'800',letterSpacing:1.2,fontSize:12},value:{color:'#fff',fontSize:34,fontWeight:'900'},cardTitle:{color:'#fff',fontSize:20,fontWeight:'800'},body:{color:'#b8b8b8',fontSize:16,lineHeight:23}})
