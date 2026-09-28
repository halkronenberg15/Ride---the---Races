import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'

export default function HomeScreen({career,riderName,ftp,rideCount,onTraining,onLibrary,onProfile,onHistory,onRide,onSignOut}:{career:CloudCareerSnapshot|null;riderName:string;ftp:number|null;rideCount:number;onTraining:()=>void;onLibrary:()=>void;onProfile:()=>void;onHistory:()=>void;onRide:()=>void;onSignOut:()=>void}){
 const tour=career?.races?.tour?.completedStages?.length??0
 const vuelta=career?.races?.vuelta?.completedStages?.length??0
 return <ScrollView contentContainerStyle={s.wrap}>
  <View style={s.header}><View><Text style={s.eyebrow}>RIDE THE RACES</Text><Text style={s.title}>Team HQ</Text></View><Pressable onPress={onSignOut}><Text style={s.link}>Sign out</Text></Pressable></View>
  <View style={s.hero}><Text style={s.label}>CLOUD RIDER</Text><Text style={s.heroTitle}>{riderName}</Text><Text style={s.body}>FTP {ftp??'—'} W · {rideCount} cloud rides</Text><Text style={s.orange}>Standalone RtR is using your imported career.</Text></View>
  <View style={s.row}><View style={s.metric}><Text style={s.label}>TOUR</Text><Text style={s.number}>{tour}</Text><Text style={s.unit}>stages complete</Text></View><View style={s.metric}><Text style={s.label}>VUELTA</Text><Text style={s.number}>{vuelta}</Text><Text style={s.unit}>stages complete</Text></View></View>
  <Pressable style={s.primary} onPress={onTraining}><Text style={s.primaryText}>OPEN TRAINING PLAN</Text></Pressable>
  <Pressable style={s.secondary} onPress={onLibrary}><Text style={s.secondaryText}>OPEN RACE LIBRARY</Text></Pressable>
  <Pressable style={s.secondary} onPress={onProfile}><Text style={s.secondaryText}>RIDER PASSPORT</Text></Pressable>
  <Pressable style={s.secondary} onPress={onHistory}><Text style={s.secondaryText}>RIDE HISTORY</Text></Pressable>
  <Pressable style={s.secondary} onPress={onRide}><Text style={s.secondaryText}>OPEN RIDE COCKPIT</Text></Pressable>
 </ScrollView>
}
const s=StyleSheet.create({wrap:{padding:20,gap:18},header:{flexDirection:'row',justifyContent:'space-between'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2},title:{color:'#fff',fontSize:38,fontWeight:'900'},link:{color:'#ff8b3d',fontWeight:'700',paddingTop:8},hero:{padding:22,borderRadius:22,backgroundColor:'#151515',borderWidth:1,borderColor:'#4a2a16',gap:8},label:{color:'#858585',fontWeight:'800',letterSpacing:1.2,fontSize:12},heroTitle:{color:'#fff',fontSize:32,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:16,lineHeight:23},orange:{color:'#ff8b3d',fontWeight:'800'},row:{flexDirection:'row',gap:12},metric:{flex:1,padding:18,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535'},number:{color:'#fff',fontSize:38,fontWeight:'900',marginTop:8},unit:{color:'#969696',fontSize:14,fontWeight:'700'},primary:{backgroundColor:'#ff6a00',padding:18,borderRadius:16,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900',fontSize:16,letterSpacing:1},secondary:{borderWidth:1,borderColor:'#555',padding:16,borderRadius:16,alignItems:'center'},secondaryText:{color:'#fff',fontWeight:'800',fontSize:15}})
