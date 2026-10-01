import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'

const TARGET=new Date('2028-07-01T00:00:00')
function daysUntilTarget(){return Math.max(0,Math.ceil((TARGET.getTime()-Date.now())/86400000))}

export default function MissionFranceLandingScreen({
 career,riderName,ftp,rideCount,onEnterHQ,onOpenTraining
}:{
 career:CloudCareerSnapshot|null
 riderName:string
 ftp:number|null
 rideCount:number
 onEnterHQ:()=>void
 onOpenTraining:()=>void
}){
 const assignments=career?.alpha4025?.trainingPlan?.weeks.flatMap(week=>week.assignments)??[]
 const today=new Date().toISOString().slice(0,10)
 const todayItems=assignments.filter(item=>item.date===today&&(item.status==='PLANNED'||item.status==='REPLACED')&&Number(item.durationMinutes??0)>0)
 return <ScrollView contentContainerStyle={s.wrap}>
  <View style={s.hero}>
   <Text style={s.kicker}>MISSION FRANCE 2028</Text>
   <Text style={s.title}>Build the rider for July 2028.</Text>
   <Text style={s.subtitle}>Training, fueling, recovery, race simulation and the long road to France in one native app.</Text>
   <View style={s.countdown}><Text style={s.count}>{daysUntilTarget()}</Text><Text style={s.countLabel}>DAYS TO JULY 2028 TARGET WINDOW</Text></View>
  </View>

  <View style={s.riderCard}>
   <Text style={s.label}>RIDER</Text>
   <Text style={s.rider}>{riderName}</Text>
   <Text style={s.meta}>FTP {ftp??'—'} W · {rideCount} cloud rides</Text>
  </View>

  <Pressable style={s.today} onPress={onOpenTraining}>
   <Text style={s.todayLabel}>TODAY</Text>
   {todayItems.length?todayItems.map(item=><Text key={item.id} style={s.todayTitle}>{item.title} · {item.durationMinutes} min</Text>):<Text style={s.todayTitle}>Recovery / no planned workload</Text>}
   <Text style={s.todayAction}>OPEN TRAINING CALENDAR →</Text>
  </Pressable>

  <Pressable style={s.enter} onPress={onEnterHQ}>
   <Text style={s.enterSmall}>TEAM LORIOT</Text>
   <Text style={s.enterTitle}>Enter Team HQ</Text>
   <Text style={s.enterArrow}>→</Text>
  </Pressable>
 </ScrollView>
}

const s=StyleSheet.create({
 wrap:{padding:20,gap:16},
 hero:{padding:24,borderRadius:24,backgroundColor:'#111318',borderWidth:1,borderColor:'#5a3018',gap:10},
 kicker:{color:'#ff6a00',fontWeight:'900',letterSpacing:2.4,fontSize:12},
 title:{color:'#fff',fontSize:42,fontWeight:'900',lineHeight:44},
 subtitle:{color:'#b6b6bc',fontSize:16,lineHeight:23},
 countdown:{marginTop:10,paddingTop:16,borderTopWidth:1,borderTopColor:'#2d2d2d'},
 count:{color:'#ff6a00',fontSize:64,fontWeight:'900',lineHeight:66},
 countLabel:{color:'#87878d',fontWeight:'900',letterSpacing:1.3,fontSize:11},
 riderCard:{padding:18,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:5},
 label:{color:'#858585',fontWeight:'900',letterSpacing:1.4,fontSize:11},
 rider:{color:'#fff',fontSize:28,fontWeight:'900'},
 meta:{color:'#aaa',fontSize:15},
 today:{padding:20,borderRadius:20,backgroundColor:'#ff6a00',gap:6},
 todayLabel:{color:'#2a1104',fontWeight:'900',letterSpacing:1.4,fontSize:12},
 todayTitle:{color:'#fff',fontSize:21,fontWeight:'900'},
 todayAction:{color:'#fff',fontWeight:'900',marginTop:5},
 enter:{padding:20,borderRadius:20,backgroundColor:'#151515',borderWidth:1,borderColor:'#3b3b3b',position:'relative',gap:4},
 enterSmall:{color:'#ff8b3d',fontWeight:'900',letterSpacing:1.5,fontSize:11},
 enterTitle:{color:'#fff',fontSize:28,fontWeight:'900'},
 enterArrow:{position:'absolute',right:20,top:27,color:'#ff8b3d',fontSize:32,fontWeight:'900'}
})