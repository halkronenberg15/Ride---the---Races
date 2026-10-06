import { StatusBar } from 'expo-status-bar'
import * as Crypto from 'expo-crypto'
import * as Location from 'expo-location'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useEffect, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { commitLegacyCareerImport, pickLegacyCareer, type LegacyImportPreview } from './lib/importLegacyCareer'
import { canUseBackgroundRideTracking, pauseBackgroundRideTracking, readBackgroundRideState, resetBackgroundRideTracking, startBackgroundRideTracking } from './lib/backgroundRide'
import { loadCloudRideCount, loadLatestCloudCareer, type CloudCareerSnapshot } from './lib/cloudCareer'
import HomeScreen from './screens/HomeScreen'
import MissionFranceLandingScreen from './screens/MissionFranceLandingScreen'
import NutritionScreen from './screens/NutritionScreen'
import TrainingScreen from './screens/TrainingScreen'
import LibraryScreen from './screens/LibraryScreen'
import ProfileScreen, { type EditableRiderProfile } from './screens/ProfileScreen'
import TrainingRideScreen from './screens/TrainingRideScreen'
import StageRoadbookScreen from './screens/StageRoadbookScreen'
import StructuredRideScreen from './screens/StructuredRideScreen'
import RaceBriefingsScreen from './screens/RaceBriefingsScreen'
import StrengthPlanScreen, { type MobileStrengthLog } from './screens/StrengthPlanScreen'
import { openCanonicalCockpit } from './lib/canonicalCockpit'
import type { RaceStage } from '../../src/data/raceStages'
import { workoutById } from '../../src/engine/adaptiveTraining40251'
import { applyHalWeeklyRhythmV2 } from '../../src/engine/alpha4025'

type RideState='idle'|'riding'|'paused'|'saving'
type AppScreen='mission'|'home'|'nutrition'|'training'|'trainingRide'|'strength'|'library'|'briefing'|'profile'|'roadbook'|'structuredRide'|'ride'
type Coord={latitude:number;longitude:number;timestamp:number}

function distanceMeters(a:Coord,b:Coord){
  const R=6371000
  const toRad=(n:number)=>n*Math.PI/180
  const dLat=toRad(b.latitude-a.latitude)
  const dLon=toRad(b.longitude-a.longitude)
  const lat1=toRad(a.latitude)
  const lat2=toRad(b.latitude)
  const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2
  return 2*R*Math.asin(Math.sqrt(h))
}

function formatTime(totalSeconds:number){
  const h=Math.floor(totalSeconds/3600)
  const m=Math.floor((totalSeconds%3600)/60)
  const s=totalSeconds%60
  return [h,m,s].map((v,i)=>i===0?String(v):String(v).padStart(2,'0')).join(':')
}

export default function App(){
  const [session,setSession]=useState<Session|null>(null)
  const [loading,setLoading]=useState(true)
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [displayName,setDisplayName]=useState('')
  const [authBusy,setAuthBusy]=useState(false)
  const [rideState,setRideState]=useState<RideState>('idle')
  const [startedAt,setStartedAt]=useState<number|null>(null)
  const [elapsed,setElapsed]=useState(0)
  const [distance,setDistance]=useState(0)
  const [lastCoord,setLastCoord]=useState<Coord|null>(null)
  const [locationStatus,setLocationStatus]=useState('GPS idle')
  const [profileId,setProfileId]=useState<string|null>(null)
  const [cloudProfile,setCloudProfile]=useState<EditableRiderProfile|null>(null)
  const [importPreview,setImportPreview]=useState<LegacyImportPreview|null>(null)
  const [importBusy,setImportBusy]=useState(false)
  const [backgroundMode,setBackgroundMode]=useState(false)
  const [screen,setScreen]=useState<AppScreen>('mission')
  const [career,setCareer]=useState<CloudCareerSnapshot|null>(null)
  const [cloudRideCount,setCloudRideCount]=useState(0)
  const [selectedStage,setSelectedStage]=useState<RaceStage|null>(null)
  const [selectedWorkoutId,setSelectedWorkoutId]=useState<string|null>(null)
  const [selectedTrainingAssignmentId,setSelectedTrainingAssignmentId]=useState<string|null>(null)
  const [selectedStrengthAssignment,setSelectedStrengthAssignment]=useState<any|null>(null)
  const [trainingOverrides,setTrainingOverrides]=useState<Record<string,string>>({})
  const locationSub=useRef<Location.LocationSubscription|null>(null)
  const activeStartedAt=useRef<number|null>(null)
  const elapsedBeforePause=useRef(0)

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      setSession(data.session)
      setLoading(false)
    })
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next))
    return()=>subscription.unsubscribe()
  },[])

  useEffect(()=>{AsyncStorage.getItem('rtr-mobile-training-overrides-v1').then(raw=>{if(raw){try{setTrainingOverrides(JSON.parse(raw) as Record<string,string>)}catch{}}})},[])

  useEffect(()=>{
    if(!session?.user?.id){setProfileId(null);return}
    supabase.from('athlete_profiles').select('athlete_id,display_name,ftp_watts,weight_kg,height_cm,rider_number,archetype,season_goal,preferred_units').eq('user_id',session.user.id).single()
      .then(({data,error})=>{
        if(error) console.warn(error.message)
        setProfileId(data?.athlete_id??null)
        setCloudProfile(data?{display_name:data.display_name,ftp_watts:data.ftp_watts,weight_kg:data.weight_kg,height_cm:data.height_cm,rider_number:data.rider_number,archetype:data.archetype,season_goal:data.season_goal,preferred_units:data.preferred_units}:null)
        if(data?.athlete_id){
          Promise.all([loadLatestCloudCareer(data.athlete_id),loadCloudRideCount(data.athlete_id)])
            .then(([snapshot,count])=>{setCareer(snapshot);setCloudRideCount(count)})
            .catch(error=>console.warn(error instanceof Error?error.message:String(error)))
        }
      })
  },[session?.user?.id])

  useEffect(()=>{
    if(rideState!=='riding')return
    const id=setInterval(()=>{
      const active=activeStartedAt.current?Math.floor((Date.now()-activeStartedAt.current)/1000):0
      setElapsed(elapsedBeforePause.current+active)
    },1000)
    return()=>clearInterval(id)
  },[rideState])

  useEffect(()=>{
    if(rideState!=='riding'||!backgroundMode)return
    let cancelled=false
    const refresh=async()=>{
      const state=await readBackgroundRideState()
      if(!cancelled)setDistance(state.distanceMeters)
    }
    refresh()
    const id=setInterval(refresh,2000)
    return()=>{cancelled=true;clearInterval(id)}
  },[rideState,backgroundMode])

  useEffect(()=>()=>{locationSub.current?.remove();deactivateKeepAwake()},[])

  const effectiveCareer=useMemo(()=>{if(!career||!career.alpha4025?.trainingPlan)return career
    const rhythmPlan=applyHalWeeklyRhythmV2(career.alpha4025.trainingPlan as any)
    const weeks=rhythmPlan.weeks.map(week=>({...week,assignments:week.assignments.map(item=>{
      const replacementId=trainingOverrides[item.id]
      if(!replacementId)return item
      const workout=workoutById(replacementId)
      if(!workout)return item
      return {...item,status:'REPLACED',workoutId:replacementId,title:workout.title,durationMinutes:workout.durationMinutes,environment:workout.environment}
    })}))
    return {...career,alpha4025:{...career.alpha4025,trainingPlan:{...rhythmPlan,weeks}}}
  },[career,trainingOverrides])

  const replaceTrainingAssignment=(assignmentId:string,workoutId:string)=>{
    setTrainingOverrides(current=>{
      const next={...current,[assignmentId]:workoutId}
      AsyncStorage.setItem('rtr-mobile-training-overrides-v1',JSON.stringify(next))
      return next
    })
  }

  const miles=distance/1609.344
  const mph=useMemo(()=>elapsed>0?miles/(elapsed/3600):0,[miles,elapsed])

  async function signUp(){
    setAuthBusy(true)
    const {error}=await supabase.auth.signUp({
      email:email.trim(),
      password,
      options:{data:{display_name:displayName.trim()||'Rider'}},
    })
    setAuthBusy(false)
    if(error) return Alert.alert('Sign up failed',error.message)
    Alert.alert('Account created','Check your email if Supabase asks you to confirm the account.')
  }

  async function signIn(){
    setAuthBusy(true)
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password})
    setAuthBusy(false)
    if(error) Alert.alert('Sign in failed',error.message)
  }

  async function beginGps(resetBackground=false){
    const {status}=await Location.requestForegroundPermissionsAsync()
    if(status!=='granted') throw new Error('Location permission is required to track the ride.')

    if(await canUseBackgroundRideTracking()){
      const background=await Location.requestBackgroundPermissionsAsync()
      if(background.status==='granted'){
        await startBackgroundRideTracking(resetBackground)
        setBackgroundMode(true)
        setLocationStatus('GPS background tracking')
        return
      }
    }

    setBackgroundMode(false)
    setLocationStatus('GPS foreground tracking')
    locationSub.current=await Location.watchPositionAsync(
      {
        accuracy:Location.Accuracy.High,
        timeInterval:3000,
        distanceInterval:5,
      },
      pos=>{
        const next:Coord={
          latitude:pos.coords.latitude,
          longitude:pos.coords.longitude,
          timestamp:pos.timestamp,
        }
        setLastCoord(prev=>{
          if(prev){
            const segment=distanceMeters(prev,next)
            if(segment<100)setDistance(total=>total+segment)
          }
          return next
        })
      }
    )
  }

  async function chooseCareerImport(){
    if(rideState!=='idle')return Alert.alert('Finish the ride first','Career import is disabled while a ride is active.')
    try{
      const preview=await pickLegacyCareer()
      if(preview)setImportPreview(preview)
    }catch(error){
      Alert.alert('Could not read career file',error instanceof Error?error.message:'Unknown import error')
    }
  }

  async function importCareer(){
    if(!profileId||!importPreview)return
    setImportBusy(true)
    try{
      const result=await commitLegacyCareerImport(importPreview,profileId)
      setCloudProfile(current=>({
        display_name:importPreview.riderName,
        ftp_watts:importPreview.ftp,
        weight_kg:importPreview.weightKg,
        height_cm:current?.height_cm??null,
        rider_number:current?.rider_number??null,
        archetype:current?.archetype??effectiveCareer?.rider.archetype??'GC Contender',
        season_goal:current?.season_goal??effectiveCareer?.rider.seasonGoal??null,
        preferred_units:current?.preferred_units??'imperial',
      }))
      const [snapshot,count]=await Promise.all([loadLatestCloudCareer(profileId),loadCloudRideCount(profileId)])
      setCareer(snapshot)
      setCloudRideCount(count)
      setImportPreview(null)
      Alert.alert(
        'Rider imported',
        `${importPreview.riderName} is now the cloud rider. ${result.imported} historical rides were added, and the original profile file was archived.`
      )
    }catch(error){
      Alert.alert('Import stopped safely',error instanceof Error?error.message:'Unknown import error')
    }finally{
      setImportBusy(false)
    }
  }

  async function startRide(){
    if(!profileId)return Alert.alert('Profile not ready','Give the rider profile a moment to finish syncing.')
    try{
      await activateKeepAwakeAsync()
      await beginGps(true)
      const now=Date.now()
      setStartedAt(now)
      activeStartedAt.current=now
      elapsedBeforePause.current=0
      setElapsed(0)
      setDistance(0)
      setLastCoord(null)
      setRideState('riding')
    }catch(error){
      deactivateKeepAwake()
      Alert.alert('Ride could not start',error instanceof Error?error.message:'Unknown error')
    }
  }

  async function pauseRide(){
    if(rideState!=='riding')return
    const active=activeStartedAt.current?Math.floor((Date.now()-activeStartedAt.current)/1000):0
    elapsedBeforePause.current+=active
    activeStartedAt.current=null
    if(backgroundMode)await pauseBackgroundRideTracking()
    locationSub.current?.remove()
    locationSub.current=null
    if(backgroundMode){
      const state=await readBackgroundRideState()
      setDistance(state.distanceMeters)
    }
    setRideState('paused')
    setLocationStatus('GPS paused')
  }

  async function resumeRide(){
    try{
      await beginGps(false)
      activeStartedAt.current=Date.now()
      setRideState('riding')
    }catch(error){
      Alert.alert('Could not resume',error instanceof Error?error.message:'Unknown error')
    }
  }

  async function finishRide(){
    if(!profileId||!startedAt)return
    await pauseRide()
    setRideState('saving')
    const completedAt=Date.now()
    const finalDistance=backgroundMode?(await readBackgroundRideState()).distanceMeters:distance
    const rideId=Crypto.randomUUID()
    const eventId=Crypto.randomUUID()
    const durationSeconds=elapsedBeforePause.current
    const rideRow={
      ride_id:rideId,
      athlete_id:profileId,
      source:'RTR',
      started_at:new Date(startedAt).toISOString(),
      completed_at:new Date(completedAt).toISOString(),
      duration_seconds:durationSeconds,
      distance_meters:Math.round(finalDistance),
    }
    const {error:rideError}=await supabase.from('rides').insert(rideRow)
    if(rideError){
      setRideState('paused')
      return Alert.alert('Ride not saved',rideError.message)
    }
    const eventPayload={
      schemaVersion:1,
      rideId,
      athleteId:profileId,
      source:'RTR',
      startedAt:rideRow.started_at,
      completedAt:rideRow.completed_at,
      durationSeconds,
      distanceMeters:rideRow.distance_meters,
    }
    const {error:eventError}=await supabase.from('athlete_events').insert({
      event_id:eventId,
      athlete_id:profileId,
      event_type:'ride.completed',
      schema_version:1,
      occurred_at:rideRow.completed_at,
      producer:'ride-the-races',
      payload:eventPayload,
    })
    await resetBackgroundRideTracking()
    deactivateKeepAwake()
    setRideState('idle')
    setStartedAt(null)
    setElapsed(0)
    setDistance(0)
    setLastCoord(null)
    setLocationStatus('GPS idle')
    setBackgroundMode(false)
    elapsedBeforePause.current=0
    activeStartedAt.current=null
    if(eventError) Alert.alert('Ride saved','The ride saved, but its sync event still needs retrying.')
    else Alert.alert('Ride saved','Your first standalone RtR ride is in the cloud.')
  }

  if(loading){
    return <SafeAreaView style={styles.root}><Text style={styles.title}>Loading RtR…</Text></SafeAreaView>
  }

  if(!session){
    return(
      <SafeAreaView style={styles.root}>
        <StatusBar style="light"/>
        <ScrollView contentContainerStyle={styles.authWrap}>
          <Text style={styles.eyebrow}>RIDE THE RACES</Text>
          <Text style={styles.title}>Your road. Your account.</Text>
          <Text style={styles.body}>This alpha uses the same cloud rider identity that Mission France will use.</Text>
          <TextInput style={styles.input} placeholder="Rider name" placeholderTextColor="#737373" value={displayName} onChangeText={setDisplayName}/>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#737373" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#737373" secureTextEntry value={password} onChangeText={setPassword}/>
          <Pressable style={styles.primary} onPress={signIn} disabled={authBusy}><Text style={styles.primaryText}>{authBusy?'Working…':'Sign in'}</Text></Pressable>
          <Pressable style={styles.secondary} onPress={signUp} disabled={authBusy}><Text style={styles.secondaryText}>Create rider account</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if(screen==='mission'){
    return <SafeAreaView style={styles.root}><StatusBar style="light"/><MissionFranceLandingScreen career={effectiveCareer} riderName={cloudProfile?.display_name??effectiveCareer?.rider.name??'Rider'} ftp={cloudProfile?.ftp_watts??effectiveCareer?.rider.ftp??null} rideCount={cloudRideCount} onEnterHQ={()=>setScreen('home')} onOpenTraining={()=>setScreen('training')}/></SafeAreaView>
  }

  if(screen==='home'){
    return <SafeAreaView style={styles.root}><StatusBar style="light"/><HomeScreen career={effectiveCareer} riderName={cloudProfile?.display_name??effectiveCareer?.rider.name??'Rider'} ftp={cloudProfile?.ftp_watts??effectiveCareer?.rider.ftp??null} rideCount={cloudRideCount} onBackMission={()=>setScreen('mission')} onTraining={()=>setScreen('training')} onNutrition={()=>setScreen('nutrition')} onLibrary={()=>setScreen('library')} onProfile={()=>setScreen('profile')} onRide={()=>setScreen('ride')} onSignOut={()=>supabase.auth.signOut()}/></SafeAreaView>
  }

  if(screen==='nutrition'){
    return <SafeAreaView style={styles.root}><StatusBar style="light"/><NutritionScreen career={effectiveCareer} onBack={()=>setScreen('home')}/></SafeAreaView>
  }

  if(screen==='training'){
    return <SafeAreaView style={styles.root}><StatusBar style="light"/><TrainingScreen career={effectiveCareer} onBack={()=>setScreen('home')} onRide={async(assignment,workoutId)=>{if(assignment.workoutId!==workoutId)replaceTrainingAssignment(assignment.id,workoutId);setSelectedTrainingAssignmentId(assignment.id);setSelectedWorkoutId(workoutId);try{await openCanonicalCockpit({kind:'training',workoutId,assignmentId:assignment.id,environment:(assignment.environment??'AUTO') as 'INDOOR'|'OUTDOOR'|'AUTO'})}catch(error){Alert.alert('Could not open cockpit',error instanceof Error?error.message:'Unknown error');setScreen('trainingRide')}} onStrength={(assignment)=>{setSelectedStrengthAssignment(assignment);setScreen('strength')}}/></SafeAreaView>
  }

  if(screen==='strength'&&selectedStrengthAssignment){
    return <SafeAreaView style={styles.root}><StatusBar style="light"/><StrengthPlanScreen assignment={selectedStrengthAssignment} onBack={()=>setScreen('training')} onSave={async(log:MobileStrengthLog)=>{const raw=await AsyncStorage.getItem('rtr-mobile-strength-logs-v1');let existing:MobileStrengthLog[]=[];if(raw){try{existing=JSON.parse(raw) as MobileStrengthLog[]}catch{}}const next=[log,...existing.filter(item=>item.assignmentId!==log.assignmentId)];await AsyncStorage.setItem('rtr-mobile-strength-logs-v1',JSON.stringify(next));if(profileId){await supabase.from('athlete_events').insert({event_id:Crypto.randomUUID(),athlete_id:profileId,event_type:'strength.completed',schema_version:1,occurred_at:log.completedAt,producer:'ride-the-races',payload:{schemaVersion:1,assignmentId:log.assignmentId,exercises:log.exercises}})}}}/></SafeAreaView>
  }

  if(screen==='trainingRide'&&selectedWorkoutId){
    return <SafeAreaView style={styles.root}><StatusBar style="light"/><TrainingRideScreen workoutId={selectedWorkoutId} assignmentId={selectedTrainingAssignmentId??undefined} ftp={cloudProfile?.ftp_watts??effectiveCareer?.rider.ftp??null} onBack={()=>setScreen('training')} onFinish={async(summary,workout)=>{if(!profileId)return;const rideId=Crypto.randomUUID();const now=new Date(summary.endedAt);const started=new Date(now.getTime()-summary.activeSeconds*1000);const row={ride_id:rideId,athlete_id:profileId,source:'RTR',started_at:started.toISOString(),completed_at:now.toISOString(),duration_seconds:summary.activeSeconds,distance_meters:null,workout_id:workout.id,notes:workout.title+' · '+summary.outcome+' · '+summary.completionPercentage+'%'};const {error}=await supabase.from('rides').insert(row);if(error)throw error;await supabase.from('athlete_events').insert({event_id:Crypto.randomUUID(),athlete_id:profileId,event_type:'ride.completed',schema_version:1,occurred_at:row.completed_at,producer:'ride-the-races',payload:{schemaVersion:2,rideId,athleteId:profileId,source:'RTR',workoutId:workout.id,assignmentId:summary.assignmentId,startedAt:row.started_at,completedAt:row.completed_at,durationSeconds:summary.activeSeconds,plannedSeconds:summary.plannedSeconds,completionPercentage:summary.completionPercentage,outcome:summary.outcome,pauseCount:summary.pauseCount,rpe:summary.rpe,legsAfter:summary.legsAfter,completedSectionIds:summary.completedSectionIds}});setCloudRideCount(count=>count+1);Alert.alert('Workout saved',workout.title+' · '+summary.completionPercentage+'% complete · RPE '+(summary.rpe??'—')+'.');setSelectedTrainingAssignmentId(null);setScreen('training')}}/></SafeAreaView>
  }

  if(screen==='library'){
    return <SafeAreaView style={styles.root}><StatusBar style="light"/><LibraryScreen onBack={()=>setScreen('home')} onOpenStage={(stage)=>{setSelectedStage(stage);setScreen('briefing')}}/></SafeAreaView>
  }

  if(screen==='briefing'&&selectedStage){
    return <SafeAreaView style={styles.root}><StatusBar style="light"/><RaceBriefingsScreen stage={selectedStage} onBack={()=>setScreen('library')} onStart={async()=>{try{await openCanonicalCockpit({kind:'race',library:'tour-2026',stageNumber:selectedStage.number,environment:'AUTO'})}catch(error){Alert.alert('Could not open cockpit',error instanceof Error?error.message:'Unknown error');setScreen('structuredRide')}}}/></SafeAreaView>
  }

  if(screen==='roadbook'){
    return <SafeAreaView style={styles.root}><StatusBar style="light"/><StageRoadbookScreen onBack={()=>setScreen('library')} onOpenStage={(stage)=>{setSelectedStage(stage);setScreen('structuredRide')}}/></SafeAreaView>
  }

  if(screen==='structuredRide'&&selectedStage){
    return <SafeAreaView style={styles.root}><StatusBar style="light"/><StructuredRideScreen stage={selectedStage} onBack={()=>setScreen('briefing')} onFinish={async(durationSeconds)=>{if(!profileId)return;const rideId=Crypto.randomUUID();const now=new Date();const started=new Date(now.getTime()-durationSeconds*1000);const row={ride_id:rideId,athlete_id:profileId,source:'RTR',started_at:started.toISOString(),completed_at:now.toISOString(),duration_seconds:durationSeconds,distance_meters:Math.round(selectedStage.distanceKm*1000),stage_number:selectedStage.number,race_id:'tour-2026',notes:selectedStage.title};const {error}=await supabase.from('rides').insert(row);if(error)throw error;await supabase.from('athlete_events').insert({event_id:Crypto.randomUUID(),athlete_id:profileId,event_type:'ride.completed',schema_version:1,occurred_at:row.completed_at,producer:'ride-the-races',payload:{schemaVersion:1,rideId,athleteId:profileId,source:'RTR',stageNumber:selectedStage.number,raceId:'tour-2026',startedAt:row.started_at,completedAt:row.completed_at,durationSeconds,distanceMeters:row.distance_meters}});setCloudRideCount(count=>count+1);Alert.alert('Stage saved','Stage '+selectedStage.number+' is in your cloud ride history.');setScreen('roadbook')}}/></SafeAreaView>
  }

  if(screen==='profile'){
    return <SafeAreaView style={styles.root}><StatusBar style="light"/><ProfileScreen career={effectiveCareer} rideCount={cloudRideCount} profile={cloudProfile} onBack={()=>setScreen('home')} onSave={async(next)=>{if(!session?.user?.id)throw new Error('Rider session is not ready.');const {error}=await supabase.from('athlete_profiles').update({display_name:next.display_name,ftp_watts:next.ftp_watts,weight_kg:next.weight_kg,height_cm:next.height_cm,rider_number:next.rider_number,archetype:next.archetype,season_goal:next.season_goal,preferred_units:next.preferred_units,profile_version:(cloudProfile?1:0)+1,updated_at:new Date().toISOString()}).eq('user_id',session.user.id);if(error)throw error;setCloudProfile(next)}}/></SafeAreaView>
  }

  return(
    <SafeAreaView style={styles.root}>
      <StatusBar style="light"/>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.headerRow}>
          <View>
            <Pressable onPress={()=>setScreen('home')}><Text style={styles.link}>← Team HQ</Text></Pressable>
            <Text style={styles.eyebrow}>RIDE THE RACES · ALPHA</Text>
            <Text style={styles.title}>Ride cockpit</Text>
          </View>
          <Pressable onPress={()=>supabase.auth.signOut()}><Text style={styles.link}>Sign out</Text></Pressable>
        </View>

        <View style={styles.metricHero}>
          <Text style={styles.metricLabel}>TIME</Text>
          <Text style={styles.time}>{formatTime(elapsed)}</Text>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}><Text style={styles.metricLabel}>DISTANCE</Text><Text style={styles.metric}>{miles.toFixed(2)}</Text><Text style={styles.unit}>mi</Text></View>
          <View style={styles.metricCard}><Text style={styles.metricLabel}>AVG SPEED</Text><Text style={styles.metric}>{mph.toFixed(1)}</Text><Text style={styles.unit}>mph</Text></View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>{locationStatus}</Text>
          <Text style={styles.body}>{profileId?'Cloud rider connected':'Finishing rider sync…'}</Text>
          {backgroundMode&&<Text style={styles.profileLine}>Lock-screen tracking enabled</Text>}
          {cloudProfile&&<Text style={styles.profileLine}>
            {cloudProfile.display_name}{cloudProfile.ftp_watts?` · FTP ${cloudProfile.ftp_watts} W`:''}{cloudProfile.weight_kg?` · ${(cloudProfile.weight_kg*2.20462).toFixed(1)} lb`:''}
          </Text>}
        </View>

        <Text style={styles.alphaNote}>Free GPS ride mode. Planned training rides open from Training Calendar; race stages open from Race Library.</Text>

        {rideState==='idle'&&<Pressable style={styles.primary} onPress={startRide}><Text style={styles.primaryText}>START RIDE</Text></Pressable>}
        {rideState==='riding'&&<Pressable style={styles.warn} onPress={pauseRide}><Text style={styles.primaryText}>PAUSE</Text></Pressable>}
        {rideState==='paused'&&(
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryAction} onPress={resumeRide}><Text style={styles.secondaryText}>RESUME</Text></Pressable>
            <Pressable style={styles.finish} onPress={finishRide}><Text style={styles.primaryText}>FINISH</Text></Pressable>
          </View>
        )}
        {rideState==='saving'&&<View style={styles.statusCard}><Text style={styles.statusTitle}>Saving ride…</Text></View>}

        <Text style={styles.alphaNote}>Expo Go uses foreground GPS. A native development build automatically upgrades this cockpit to background/locked-screen GPS when permission is granted. Sensors come next.</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#090909'},
  wrap:{padding:20,gap:18},
  authWrap:{padding:24,justifyContent:'center',minHeight:'100%',gap:14},
  headerRow:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:12},
  eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2,marginBottom:8},
  title:{color:'#fff',fontSize:36,fontWeight:'900',lineHeight:39},
  body:{color:'#b8b8b8',fontSize:16,lineHeight:23},
  link:{color:'#ff8b3d',fontWeight:'700',paddingTop:8},
  input:{backgroundColor:'#151515',borderColor:'#353535',borderWidth:1,borderRadius:14,padding:16,color:'#fff',fontSize:16},
  primary:{backgroundColor:'#ff6a00',padding:18,borderRadius:16,alignItems:'center'},
  primaryText:{color:'#fff',fontWeight:'900',fontSize:16,letterSpacing:1},
  secondary:{borderWidth:1,borderColor:'#555',padding:16,borderRadius:16,alignItems:'center'},
  secondaryText:{color:'#fff',fontWeight:'800',fontSize:15},
  warn:{backgroundColor:'#d98a00',padding:18,borderRadius:16,alignItems:'center'},
  finish:{backgroundColor:'#c63b2f',padding:18,borderRadius:16,alignItems:'center',flex:1},
  secondaryAction:{borderWidth:1,borderColor:'#555',padding:18,borderRadius:16,alignItems:'center',flex:1},
  actionRow:{flexDirection:'row',gap:12},
  metricHero:{padding:24,borderRadius:22,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535'},
  metricLabel:{color:'#858585',fontWeight:'800',letterSpacing:1.2,fontSize:12},
  time:{color:'#fff',fontSize:58,fontWeight:'900',letterSpacing:-2,marginTop:4},
  metricRow:{flexDirection:'row',gap:12},
  metricCard:{flex:1,padding:18,borderRadius:18,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535'},
  metric:{color:'#fff',fontSize:38,fontWeight:'900',marginTop:8},
  unit:{color:'#969696',fontSize:14,fontWeight:'700'},
  statusCard:{padding:16,borderRadius:16,backgroundColor:'#111',borderWidth:1,borderColor:'#2b2b2b'},
  statusTitle:{color:'#fff',fontWeight:'800',fontSize:16,marginBottom:4},
  profileLine:{color:'#ff8b3d',fontWeight:'800',fontSize:14,marginTop:8},
  importCard:{padding:18,borderRadius:18,backgroundColor:'#111',borderWidth:1,borderColor:'#3a2a1f',gap:12},
  importPreview:{gap:10,paddingTop:6},
  alphaNote:{color:'#737373',fontSize:13,lineHeight:19,marginTop:6},
})
