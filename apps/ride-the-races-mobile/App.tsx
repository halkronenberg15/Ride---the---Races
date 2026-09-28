import { StatusBar } from 'expo-status-bar'
import * as Crypto from 'expo-crypto'
import * as Location from 'expo-location'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useEffect, useMemo, useRef, useState } from 'react'
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
import TrainingScreen from './screens/TrainingScreen'
import LibraryScreen from './screens/LibraryScreen'

type RideState='idle'|'riding'|'paused'|'saving'
type AppScreen='home'|'training'|'library'|'ride'
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
  const [cloudProfile,setCloudProfile]=useState<{display_name:string;ftp_watts:number|null;weight_kg:number|null}|null>(null)
  const [importPreview,setImportPreview]=useState<LegacyImportPreview|null>(null)
  const [importBusy,setImportBusy]=useState(false)
  const [backgroundMode,setBackgroundMode]=useState(false)
  const [screen,setScreen]=useState<AppScreen>('home')
  const [career,setCareer]=useState<CloudCareerSnapshot|null>(null)
  const [cloudRideCount,setCloudRideCount]=useState(0)
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

  useEffect(()=>{
    if(!session?.user?.id){setProfileId(null);return}
    supabase.from('athlete_profiles').select('athlete_id,display_name,ftp_watts,weight_kg').eq('user_id',session.user.id).single()
      .then(({data,error})=>{
        if(error) console.warn(error.message)
        setProfileId(data?.athlete_id??null)
        setCloudProfile(data?{display_name:data.display_name,ftp_watts:data.ftp_watts,weight_kg:data.weight_kg}:null)
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
      setCloudProfile({
        display_name:importPreview.riderName,
        ftp_watts:importPreview.ftp,
        weight_kg:importPreview.weightKg,
      })
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

  return(
    <SafeAreaView style={styles.root}>
      <StatusBar style="light"/>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.headerRow}>
          <View>
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

        <View style={styles.importCard}>
          <Text style={styles.metricLabel}>EXISTING RTR RIDER</Text>
          <Text style={styles.statusTitle}>Bring your current career with you</Text>
          <Text style={styles.body}>Choose the JSON file created by Export My RtR Career. The source file is archived before any historical rides are added.</Text>
          <Pressable style={styles.secondary} onPress={chooseCareerImport} disabled={rideState!=='idle'||importBusy}>
            <Text style={styles.secondaryText}>CHOOSE RTR CAREER FILE</Text>
          </Pressable>
          {importPreview&&<View style={styles.importPreview}>
            <Text style={styles.statusTitle}>{importPreview.riderName}</Text>
            <Text style={styles.body}>FTP {importPreview.ftp??'—'} W · {importPreview.rideCount} rides · {importPreview.trainingCount} training completions</Text>
            <Text style={styles.alphaNote}>Source app {importPreview.sourceApplicationVersion} · schema {importPreview.sourceSchemaVersion} · {importPreview.fileName}</Text>
            <Pressable style={styles.primary} onPress={importCareer} disabled={importBusy}>
              <Text style={styles.primaryText}>{importBusy?'IMPORTING…':'CONFIRM IMPORT'}</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={()=>setImportPreview(null)} disabled={importBusy}>
              <Text style={styles.secondaryText}>CANCEL</Text>
            </Pressable>
          </View>}
        </View>

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
