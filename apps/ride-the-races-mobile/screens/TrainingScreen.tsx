import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'

export default function TrainingScreen({career,onBack,onRide}:{career:CloudCareerSnapshot|null;onBack:()=>void;onRide:()=>void}){
 const items=(career?.alpha4025?.trainingPlan?.weeks.flatMap(w=>w.assignments)??[]).filter(x=>x.status==='PLANNED').sort((a,b)=>a.date.localeCompare(b.date)).slice(0,8)
 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>RIDER DEVELOPMENT</Text><Text style={s.title}>Off-Season Training</Text>
  <Text style={s.body}>Your imported 24-week plan is now visible in the standalone app.</Text>
  {items.length===0?<View style={s.card}><Text style={s.body}>No planned assignments found.</Text></View>:items.map(x=><View key={x.id} style={s.card}><View style={s.top}><Text style={s.label}>{x.date}</Text><Text style={s.type}>{x.type}</Text></View><Text style={s.cardTitle}>{x.title??x.workoutId??'Planned session'}</Text><Text style={s.body}>{x.durationMinutes??'—'} min · {x.environment??'FLEXIBLE'}</Text>{(x.type==='CYCLING'||x.type==='ASSESSMENT')&&<Pressable style={s.button} onPress={onRide}><Text style={s.buttonText}>OPEN RIDE →</Text></Pressable>}</View>)}
 </ScrollView>
}
const s=StyleSheet.create({wrap:{padding:20,gap:16},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2},title:{color:'#fff',fontSize:36,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:16,lineHeight:23},card:{padding:18,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:8},top:{flexDirection:'row',justifyContent:'space-between'},label:{color:'#858585',fontWeight:'800',letterSpacing:1.2,fontSize:12},type:{color:'#ff8b3d',fontSize:12,fontWeight:'900',letterSpacing:1},cardTitle:{color:'#fff',fontWeight:'800',fontSize:18},button:{marginTop:6,borderWidth:1,borderColor:'#555',padding:12,borderRadius:12,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'800'}})
