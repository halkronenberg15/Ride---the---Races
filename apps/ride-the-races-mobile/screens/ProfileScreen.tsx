import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'

export type EditableRiderProfile={
  display_name:string
  ftp_watts:number|null
  weight_kg:number|null
  height_cm:number|null
  rider_number:number|null
  archetype:string|null
  season_goal:string|null
  preferred_units:'imperial'|'metric'
}

const archetypes=['GC Contender','Sprinter','Climber','Puncheur','Time Trial Specialist','All-Rounder','Domestique']

export default function ProfileScreen({
  career,rideCount,profile,onBack,onSave
}:{
  career:CloudCareerSnapshot|null
  rideCount:number
  profile:EditableRiderProfile|null
  onBack:()=>void
  onSave:(next:EditableRiderProfile)=>Promise<void>
}){
 const fallback=career?.rider
 const initial=useMemo<EditableRiderProfile>(()=>({
   display_name:profile?.display_name??fallback?.name??'Rider',
   ftp_watts:profile?.ftp_watts??fallback?.ftp??null,
   weight_kg:profile?.weight_kg??fallback?.weightKg??null,
   height_cm:profile?.height_cm??null,
   rider_number:profile?.rider_number??null,
   archetype:profile?.archetype??fallback?.archetype??'GC Contender',
   season_goal:profile?.season_goal??fallback?.seasonGoal??'',
   preferred_units:profile?.preferred_units??career?.settings?.measurementSystem??'imperial',
 }),[profile,fallback?.name,fallback?.ftp,fallback?.weightKg,fallback?.archetype,fallback?.seasonGoal,career?.settings?.measurementSystem])

 const [name,setName]=useState(initial.display_name)
 const [ftp,setFtp]=useState(initial.ftp_watts?String(initial.ftp_watts):'')
 const [weight,setWeight]=useState(initial.weight_kg?String((initial.weight_kg*2.20462).toFixed(1)):'')
 const [height,setHeight]=useState(initial.height_cm?String((initial.height_cm/2.54).toFixed(1)):'')
 const [number,setNumber]=useState(initial.rider_number?String(initial.rider_number):'')
 const [archetype,setArchetype]=useState(initial.archetype??'GC Contender')
 const [goal,setGoal]=useState(initial.season_goal??'')
 const [saving,setSaving]=useState(false)

 const save=async()=>{
  const next:EditableRiderProfile={
    display_name:name.trim()||'Rider',
    ftp_watts:ftp?Math.max(60,Math.min(600,Number(ftp))):null,
    weight_kg:weight?Number(weight)/2.20462:null,
    height_cm:height?Number(height)*2.54:null,
    rider_number:number?Math.max(1,Math.min(999,Number(number))):null,
    archetype:archetype||null,
    season_goal:goal.trim()||null,
    preferred_units:'imperial',
  }
  setSaving(true)
  try{await onSave(next);Alert.alert('Profile saved','Your cloud rider profile is now the source of truth.')}
  catch(error){Alert.alert('Could not save profile',error instanceof Error?error.message:'Unknown error')}
  finally{setSaving(false)}
 }

 return <ScrollView contentContainerStyle={s.wrap}>
  <Pressable onPress={onBack}><Text style={s.link}>← Team HQ</Text></Pressable>
  <Text style={s.eyebrow}>RIDER PASSPORT</Text>
  <Text style={s.title}>Edit Rider</Text>
  <Text style={s.body}>Update the live cloud rider here. Imported JSON remains an archive, not the authority for current weight, FTP or profile details.</Text>

  <View style={s.grid}>
   <View style={s.card}><Text style={s.label}>CLOUD RIDES</Text><Text style={s.value}>{rideCount}</Text></View>
   <View style={s.card}><Text style={s.label}>CURRENT FTP</Text><Text style={s.value}>{profile?.ftp_watts??fallback?.ftp??'—'} W</Text></View>
  </View>

  <Field label="Rider name" value={name} onChangeText={setName}/>
  <Field label="Race number" value={number} onChangeText={setNumber} keyboardType="number-pad"/>
  <Field label="Current FTP (watts)" value={ftp} onChangeText={setFtp} keyboardType="number-pad"/>
  <Field label="Weight (lb)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad"/>
  <Field label="Height (in)" value={height} onChangeText={setHeight} keyboardType="decimal-pad"/>

  <View style={s.inputCard}><Text style={s.inputLabel}>Rider archetype</Text><View style={s.choiceWrap}>{archetypes.map(item=><Pressable key={item} onPress={()=>setArchetype(item)} style={[s.choice,archetype===item&&s.choiceActive]}><Text style={[s.choiceText,archetype===item&&s.choiceTextActive]}>{item}</Text></Pressable>)}</View></View>

  <Field label="Season goal" value={goal} onChangeText={setGoal} multiline/>

  <Pressable style={s.primary} onPress={save} disabled={saving}><Text style={s.primaryText}>{saving?'SAVING…':'SAVE RIDER PROFILE'}</Text></Pressable>

  <View style={s.historySection}>
   <Text style={s.historyEyebrow}>RIDE HISTORY</Text>
   <Text style={s.historyTitle}>{career?.rideHistory.length??0} recorded rides</Text>
   {[...(career?.rideHistory??[])].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30).map(ride=>{
    const title=ride.workoutId??ride.source??'Ride'
    const miles=(ride.distanceKm*0.621371).toFixed(1)
    return <View key={ride.id} style={s.rideRow}><View style={s.rideTop}><Text style={s.rideTitle}>{title}</Text><Text style={s.rideDate}>{ride.date.slice(0,10)}</Text></View><Text style={s.rideMeta}>{Math.round(ride.durationMinutes)} min · {miles} mi{ride.averagePower?' · '+Math.round(ride.averagePower)+' W':''}</Text></View>
   })}
  </View>
 </ScrollView>
}

function Field({label,value,onChangeText,keyboardType,multiline}:{label:string;value:string;onChangeText:(value:string)=>void;keyboardType?:'default'|'number-pad'|'decimal-pad';multiline?:boolean}){
 return <View style={s.inputCard}><Text style={s.inputLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType??'default'} multiline={multiline} style={[s.input,multiline&&s.multi]} placeholderTextColor="#707070"/></View>
}

const s=StyleSheet.create({wrap:{padding:20,gap:14},link:{color:'#ff8b3d',fontWeight:'700'},eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2},title:{color:'#fff',fontSize:36,fontWeight:'900'},body:{color:'#b8b8b8',fontSize:16,lineHeight:23},grid:{flexDirection:'row',gap:12},card:{flex:1,padding:18,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:8},label:{color:'#858585',fontWeight:'800',letterSpacing:1.2,fontSize:12},value:{color:'#fff',fontSize:28,fontWeight:'900'},inputCard:{padding:14,borderRadius:16,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535',gap:8},inputLabel:{color:'#a0a0a0',fontWeight:'800',fontSize:13},input:{backgroundColor:'#0f0f0f',borderWidth:1,borderColor:'#333',borderRadius:12,padding:14,color:'#fff',fontSize:17},multi:{minHeight:90,textAlignVertical:'top'},choiceWrap:{flexDirection:'row',flexWrap:'wrap',gap:8},choice:{paddingVertical:9,paddingHorizontal:11,borderRadius:999,borderWidth:1,borderColor:'#444'},choiceActive:{backgroundColor:'#ff6a00',borderColor:'#ff6a00'},choiceText:{color:'#bbb',fontWeight:'700'},choiceTextActive:{color:'#fff'},primary:{backgroundColor:'#ff6a00',padding:18,borderRadius:16,alignItems:'center',marginTop:4},primaryText:{color:'#fff',fontWeight:'900',fontSize:16,letterSpacing:.5},historySection:{marginTop:12,padding:16,borderRadius:18,backgroundColor:'#111',borderWidth:1,borderColor:'#353535',gap:10},historyEyebrow:{color:'#ff6a00',fontSize:11,fontWeight:'900',letterSpacing:1.5},historyTitle:{color:'#fff',fontSize:22,fontWeight:'900'},rideRow:{paddingVertical:11,borderTopWidth:1,borderTopColor:'#292929'},rideTop:{flexDirection:'row',justifyContent:'space-between',gap:10},rideTitle:{color:'#fff',fontWeight:'800',flex:1},rideDate:{color:'#777',fontSize:12,fontWeight:'700'},rideMeta:{color:'#999',fontSize:13,marginTop:4}})
