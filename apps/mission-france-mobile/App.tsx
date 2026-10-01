import { useEffect, useState } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { CONNECTOR_REGISTRY } from '../../packages/device-connectors/src/index'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { emptyTrainingJournal, ensureHalSep30TrainingJournal, type TrainingJournalState } from '../../packages/training-journal/src/index'

const featured=['RTR','POWER_METER','WHOOP','PELOTON','GARMIN','STRAVA','APPLE_HEALTH'] as const

export default function App() {
  const sources=CONNECTOR_REGISTRY.filter(item=>featured.includes(item.provider as typeof featured[number]))
  const [journal,setJournal]=useState<TrainingJournalState>(emptyTrainingJournal())
  useEffect(()=>{let active=true;(async()=>{const raw=await AsyncStorage.getItem('mission-france:training-journal:v1');const restored=raw?JSON.parse(raw) as TrainingJournalState:emptyTrainingJournal();const next=ensureHalSep30TrainingJournal(restored);if(active)setJournal(next);await AsyncStorage.setItem('mission-france:training-journal:v1',JSON.stringify(next))})().catch(()=>{});return()=>{active=false}},[])
  const latest=journal.entries[0]??null
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>MISSION FRANCE 2028</Text>
          <Text style={styles.title}>Build the rider.</Text>
          <Text style={styles.body}>
            Standalone athlete command center for nutrition, recovery, strength, body composition, long-term readiness and Jimmy AI coaching.
          </Text>
          <View style={styles.sync}>
            <Text style={styles.syncTitle}>RtR ride sync</Text>
            <Text style={styles.syncBody}>Completed Ride the Races activities arrive through the shared athlete cloud and become coaching evidence automatically.</Text>
          </View>
        </View>

        <View style={styles.sources}>
          <Text style={styles.eyebrow}>TRAINING JOURNAL</Text>
          <Text style={styles.sectionTitle}>Stats + feedback + coaching.</Text>
          {latest?<View style={styles.source}><View style={styles.sourceTop}><Text style={styles.sourceName}>{latest.title}</Text><Text style={styles.badge}>{latest.date}</Text></View><Text style={styles.capabilities}>{latest.stats.averagePowerWatts??'—'} W AVG · {latest.stats.averageCadenceRpm??'—'} RPM · {latest.stats.averageHeartRateBpm??'—'} BPM</Text><Text style={styles.note}>{latest.coach?.summary??'Coach interpretation pending.'}</Text><Text style={styles.note}>{latest.fueling.length?latest.fueling.map(item=>(item.minute!==undefined?'MIN '+item.minute+' · ':'')+item.label+(item.carbohydrateGrams!==undefined?' · '+item.carbohydrateGrams+'g carbs':'')).join('\n'):'No ride fueling logged.'}</Text></View>:<Text style={styles.body}>No journal entries yet.</Text>}
        </View>

        <View style={styles.sources}>
          <Text style={styles.eyebrow}>CONNECTED DATA</Text>
          <Text style={styles.sectionTitle}>Your training evidence, one place.</Text>
          <Text style={styles.body}>Mission France can combine rider-authorized sensor, wearable, cycling-app and health-platform data. Nothing below is treated as connected until you authorize it.</Text>
          {sources.map(source=><View key={source.provider} style={styles.source}>
            <View style={styles.sourceTop}><Text style={styles.sourceName}>{source.displayName}</Text><Text style={styles.badge}>{source.transport.replace('_',' ')}</Text></View>
            <Text style={styles.capabilities}>{source.capabilities.slice(0,6).join(' · ')}</Text>
            <Text style={styles.note}>{source.notes}</Text>
          </View>)}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#090909'},
  wrap:{padding:20,gap:18},
  card:{padding:24,borderRadius:24,backgroundColor:'#151515',borderWidth:1,borderColor:'#5a2b0b'},
  eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2,marginBottom:10},
  title:{color:'#fff',fontSize:40,fontWeight:'900',lineHeight:42,marginBottom:14},
  sectionTitle:{color:'#fff',fontSize:26,fontWeight:'900',lineHeight:30,marginBottom:10},
  body:{color:'#b8b8b8',fontSize:16,lineHeight:23},
  sync:{marginTop:22,padding:16,borderRadius:16,backgroundColor:'#1c120b'},
  syncTitle:{color:'#fff',fontWeight:'800',fontSize:16,marginBottom:5},
  syncBody:{color:'#c9b7aa',fontSize:15,lineHeight:22},
  sources:{padding:20,borderRadius:22,backgroundColor:'#111',borderWidth:1,borderColor:'#2b2b2b'},
  source:{marginTop:12,padding:14,borderRadius:16,backgroundColor:'#181818',borderWidth:1,borderColor:'#303030'},
  sourceTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10},
  sourceName:{color:'#fff',fontSize:17,fontWeight:'900'},
  badge:{color:'#ff9b58',fontSize:10,fontWeight:'900',letterSpacing:1},
  capabilities:{color:'#bdbdbd',fontSize:12,fontWeight:'700',marginTop:7},
  note:{color:'#818181',fontSize:12,lineHeight:17,marginTop:6}
})
