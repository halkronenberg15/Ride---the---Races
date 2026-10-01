import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'

function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}

export default function HomeScreen({career,riderName,ftp,rideCount,onTraining,onLibrary,onProfile,onHistory,onRide,onSignOut}:{career:CloudCareerSnapshot|null;riderName:string;ftp:number|null;rideCount:number;onTraining:()=>void;onLibrary:()=>void;onProfile:()=>void;onHistory:()=>void;onRide:()=>void;onSignOut:()=>void}){
 const today=localDate()
 const assignments=career?.alpha4025?.trainingPlan?.weeks.flatMap(w=>w.assignments)??[]
 const todayItems=assignments.filter(x=>x.date===today&&(x.status==='PLANNED'||x.status==='REPLACED')&&Number(x.durationMinutes??0)>0)
 return <ScrollView contentContainerStyle={s.wrap}>
  <View style={s.header}><View><Text style={s.eyebrow}>TEAM LORIOT</Text><Text style={s.title}>Team HQ</Text></View><Pressable onPress={onSignOut}><Text style={s.link}>Sign out</Text></Pressable></View>

  <View style={s.rider}><Text style={s.label}>RIDER</Text><Text style={s.riderName}>{riderName}</Text><Text style={s.body}>FTP {ftp??'—'} W · {rideCount} cloud rides</Text></View>

  <Pressable style={s.today} onPress={onTraining}>
    <Text style={s.todayLabel}>TODAY'S TRAINING</Text>
    {todayItems.length?<>{todayItems.map(x=><Text key={x.id} style={s.todayTitle}>{x.title} · {x.durationMinutes} min</Text>)}<Text style={s.todayAction}>OPEN TODAY IN CALENDAR →</Text></>:<><Text style={s.todayTitle}>Recovery / no planned workload</Text><Text style={s.todayAction}>OPEN TRAINING CALENDAR →</Text></>}
  </Pressable>

  <Text style={s.section}>TEAM OPERATIONS</Text>
  <View style={s.grid}>
   <Nav title="TRAINING CALENDAR" subtitle="24-week plan · rides · strength" onPress={onTraining}/>
   <Nav title="RACE LIBRARY" subtitle="Tour · Vuelta · Classics · training rides" onPress={onLibrary}/>
   <Nav title="RIDER PASSPORT" subtitle="Profile · FTP · weight · goals" onPress={onProfile}/>
   <Nav title="RIDE HISTORY" subtitle="Cloud ride record" onPress={onHistory}/>
  </View>

  <Text style={s.section}>OUTDOOR TOOLS</Text>
  <Pressable style={s.utility} onPress={onRide}><Text style={s.utilityTitle}>GPS RIDE COCKPIT</Text><Text style={s.utilityText}>Use this for free outdoor GPS tracking. Planned indoor and race rides open from Training or Race Library.</Text></Pressable>
 </ScrollView>
}
function Nav({title,subtitle,onPress}:{title:string;subtitle:string;onPress:()=>void}){return <Pressable style={s.navCard} onPress={onPress}><Text style={s.navTitle}>{title}</Text><Text style={s.navSub}>{subtitle}</Text><Text style={s.arrow}>→</Text></Pressable>}
const s=StyleSheet.create({wrap:{padding:20,gap:16},header:{flexDirection:'row',justifyContent:'space-between'},eyebrow:{color:'#ff6a00',fontWeight:'900',letterSpacing:2},title:{color:'#fff',fontSize:40,fontWeight:'900'},link:{color:'#ff8b3d',fontWeight:'700',paddingTop:8},rider:{padding:18,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:5},label:{color:'#858585',fontWeight:'800',letterSpacing:1.2,fontSize:11},riderName:{color:'#fff',fontSize:27,fontWeight:'900'},body:{color:'#aaa',fontSize:15},today:{padding:20,borderRadius:20,backgroundColor:'#ff6a00',gap:6},todayLabel:{color:'#1b0d04',fontWeight:'900',letterSpacing:1.4,fontSize:12},todayTitle:{color:'#fff',fontSize:21,fontWeight:'900'},todayAction:{color:'#fff',fontWeight:'900',marginTop:5},section:{color:'#777',fontWeight:'900',letterSpacing:1.4,fontSize:12,marginTop:4},grid:{gap:10},navCard:{padding:17,borderRadius:17,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',position:'relative'},navTitle:{color:'#fff',fontSize:17,fontWeight:'900'},navSub:{color:'#8f8f8f',fontSize:13,marginTop:3,paddingRight:30},arrow:{position:'absolute',right:16,top:24,color:'#ff8b3d',fontSize:24,fontWeight:'900'},utility:{padding:17,borderRadius:17,borderWidth:1,borderColor:'#4a2a16',backgroundColor:'#100d0b'},utilityTitle:{color:'#ff8b3d',fontWeight:'900'},utilityText:{color:'#888',fontSize:13,lineHeight:19,marginTop:5}})
