import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { strengthSessionForAssignment } from '../../../src/engine/strengthTraining4026'

export type MobileStrengthExerciseLog={exerciseId:string;setsCompleted:number;loadUsed:string}
export type MobileStrengthLog={assignmentId:string;completedAt:string;exercises:MobileStrengthExerciseLog[]}

export default function StrengthPlanScreen({assignment,onBack,onSave}:{assignment:any;onBack:()=>void;onSave?:(log:MobileStrengthLog)=>Promise<void>|void}){
 const session=useMemo(()=>strengthSessionForAssignment(assignment as any),[assignment])
 const [sets,setSets]=useState<Record<string,string>>(()=>Object.fromEntries(session.exercises.map(ex=>[ex.id,String(ex.sets)])))
 const [loads,setLoads]=useState<Record<string,string>>(()=>Object.fromEntries(session.exercises.map(ex=>[ex.id,''])))
 const [saving,setSaving]=useState(false)

 const save=async()=>{
  setSaving(true)
  try{
   await onSave?.({
    assignmentId:assignment.id,
    completedAt:new Date().toISOString(),
    exercises:session.exercises.map(ex=>({
     exerciseId:ex.id,
     setsCompleted:Math.max(0,Number.parseInt(sets[ex.id]||'0',10)||0),
     loadUsed:(loads[ex.id]??'').trim(),
    })),
   })
   Alert.alert('Strength saved',session.title+' log saved.')
   onBack()
  }finally{setSaving(false)}
 }

 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Training Calendar</Text></Pressable>
  <Text style={s.eyebrow}>RTR STRENGTH</Text><Text style={s.title}>{session.title}</Text>
  <Text style={s.body}>{session.durationMinutes} min · {session.purpose}</Text>

  <View style={s.card}><Text style={s.section}>WARM-UP</Text>{session.warmup.map(item=><Text key={item} style={s.body}>• {item}</Text>)}</View>

  {session.exercises.map((ex,index)=><View key={ex.id} style={s.exercise}>
    <View style={s.top}><Text style={s.index}>{index+1}</Text><View style={s.flex}><Text style={s.exerciseTitle}>{ex.name}</Text><Text style={s.prescription}>{ex.sets} sets · {ex.repLabel} · {ex.restSeconds}s rest</Text></View></View>
    <Text style={s.body}>{ex.focus}</Text>
    <View style={s.load}><Text style={s.label}>PRESCRIBED LOAD / EFFORT</Text><Text style={s.loadText}>{ex.loadGuidance}</Text></View>
    <View style={s.logRow}>
      <View style={s.setField}><Text style={s.label}>SETS DONE</Text><TextInput value={sets[ex.id]??''} onChangeText={value=>setSets(current=>({...current,[ex.id]:value.replace(/[^0-9]/g,'')}))} keyboardType="number-pad" placeholder={String(ex.sets)} placeholderTextColor="#555" style={s.input}/></View>
      <View style={s.weightField}><Text style={s.label}>LOAD USED</Text><TextInput value={loads[ex.id]??''} onChangeText={value=>setLoads(current=>({...current,[ex.id]:value}))} placeholder="e.g. 35 lb" placeholderTextColor="#555" style={s.input}/></View>
    </View>
    <Text style={s.sub}>Substitution: {ex.substitution}</Text>
  </View>)}

  <View style={s.card}><Text style={s.section}>PROGRESSION</Text><Text style={s.body}>{session.progression}</Text></View>
  <View style={s.card}><Text style={s.section}>COOLDOWN</Text>{session.cooldown.map(item=><Text key={item} style={s.body}>• {item}</Text>)}</View>
  <Pressable disabled={saving} onPress={save} style={s.save}><Text style={s.saveText}>{saving?'SAVING…':'SAVE STRENGTH SESSION'}</Text></Pressable>
 </ScrollView>
}
const s=StyleSheet.create({wrap:{padding:20,gap:14,paddingBottom:36},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'900',letterSpacing:2},title:{color:'#fff',fontSize:38,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:15,lineHeight:22},card:{padding:17,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:8},section:{color:'#ff8b3d',fontWeight:'900',letterSpacing:1.2},exercise:{padding:17,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#3d2b20',gap:10},top:{flexDirection:'row',gap:12,alignItems:'center'},index:{width:34,height:34,borderRadius:17,backgroundColor:'#ff6a00',color:'#fff',textAlign:'center',paddingTop:7,fontWeight:'900'},flex:{flex:1},exerciseTitle:{color:'#fff',fontSize:21,fontWeight:'900'},prescription:{color:'#ff9b55',fontSize:13,fontWeight:'800',marginTop:2},load:{backgroundColor:'#0d0d0d',padding:12,borderRadius:12,gap:4},label:{color:'#777',fontSize:10,fontWeight:'800',letterSpacing:1},loadText:{color:'#fff',fontWeight:'800'},sub:{color:'#888',fontSize:13},logRow:{flexDirection:'row',gap:8},setField:{width:92,gap:5},weightField:{flex:1,gap:5},input:{backgroundColor:'#0b0b0b',borderWidth:1,borderColor:'#383838',borderRadius:11,color:'#fff',paddingHorizontal:12,paddingVertical:11,fontSize:16,fontWeight:'800'},save:{backgroundColor:'#ff6a00',borderRadius:14,paddingVertical:15,alignItems:'center'},saveText:{color:'#111',fontSize:13,fontWeight:'900',letterSpacing:.8}})
