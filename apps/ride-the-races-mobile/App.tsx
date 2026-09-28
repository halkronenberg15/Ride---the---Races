import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>RIDE THE RACES</Text>
        <Text style={styles.title}>The road lives here.</Text>
        <Text style={styles.body}>
          Standalone mobile foundation. Race execution, training, outdoor rides and ride history will migrate here without changing production RtR until acceptance testing passes.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#090909',padding:20,justifyContent:'center'},
  card:{padding:24,borderRadius:24,backgroundColor:'#151515',borderWidth:1,borderColor:'#353535'},
  eyebrow:{color:'#ff6a00',fontWeight:'800',letterSpacing:2,marginBottom:10},
  title:{color:'#fff',fontSize:40,fontWeight:'900',lineHeight:42,marginBottom:14},
  body:{color:'#b8b8b8',fontSize:17,lineHeight:25}
})
