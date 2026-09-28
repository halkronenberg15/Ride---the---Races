import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>MISSION FRANCE 2028</Text>
        <Text style={styles.title}>Build the rider.</Text>
        <Text style={styles.body}>
          Standalone athlete command center for nutrition, recovery, strength, body composition, long-term readiness and Jimmy AI coaching.
        </Text>
        <View style={styles.sync}>
          <Text style={styles.syncTitle}>RtR ride sync</Text>
          <Text style={styles.syncBody}>Completed Ride the Races activities will arrive automatically through the shared athlete event contract.</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#090909',padding:20,justifyContent:'center'},
  card:{padding:24,borderRadius:24,backgroundColor:'#151515',borderWidth:1,borderColor:'#5a2b0b'},
  eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2,marginBottom:10},
  title:{color:'#fff',fontSize:40,fontWeight:'900',lineHeight:42,marginBottom:14},
  body:{color:'#b8b8b8',fontSize:17,lineHeight:25},
  sync:{marginTop:22,padding:16,borderRadius:16,backgroundColor:'#1c120b'},
  syncTitle:{color:'#fff',fontWeight:'800',fontSize:16,marginBottom:5},
  syncBody:{color:'#c9b7aa',fontSize:15,lineHeight:22}
})
