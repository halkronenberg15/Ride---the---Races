import { StyleSheet, Text, View } from 'react-native'
import type { RideSegment } from '../../../src/data/raceStages'

function terrainIcon(segment:RideSegment){
 const t=(segment.type+' '+segment.terrainLabel+' '+segment.name).toLowerCase()
 if(/climb|mountain|summit|category|hc/.test(t))return '▲'
 if(/descent|recovery/.test(t))return '↘'
 if(/sprint|finish|lead-out|leadout/.test(t))return '⚡'
 if(/rolling|hilly|rollers/.test(t))return '〰'
 return '→'
}
export default function RoadAheadCard({current,next,remaining}:{current:RideSegment;next?:RideSegment;remaining:number}){
 return <View style={s.card}>
  <Text style={s.label}>ROAD AHEAD</Text>
  <View style={s.row}>
   <View style={s.iconBox}><Text style={s.icon}>{terrainIcon(current)}</Text></View>
   <View style={s.copy}><Text style={s.now}>NOW · {Math.ceil(remaining/60)} MIN</Text><Text style={s.title}>{current.name}</Text><Text style={s.detail}>{current.terrainLabel||current.type}</Text></View>
  </View>
  <View style={s.divider}/>
  <View style={s.row}>
   <View style={[s.iconBox,s.nextBox]}><Text style={s.nextIcon}>{next?terrainIcon(next):'▥'}</Text></View>
   <View style={s.copy}><Text style={s.nextLabel}>NEXT</Text><Text style={s.nextTitle}>{next?.name??'Finish line'}</Text>{next&&<Text style={s.detail}>{next.terrainLabel||next.type}</Text>}</View>
  </View>
 </View>
}
const s=StyleSheet.create({card:{padding:16,borderRadius:18,backgroundColor:'#121212',borderWidth:1,borderColor:'#323232'},label:{color:'#858585',fontSize:10,fontWeight:'900',letterSpacing:1.2,marginBottom:12},row:{flexDirection:'row',gap:12,alignItems:'center'},iconBox:{width:42,height:42,borderRadius:12,backgroundColor:'#24170e',alignItems:'center',justifyContent:'center'},nextBox:{backgroundColor:'#181818'},icon:{color:'#ff8b3d',fontSize:22,fontWeight:'900'},nextIcon:{color:'#aaa',fontSize:20,fontWeight:'900'},copy:{flex:1},now:{color:'#ff8b3d',fontSize:10,fontWeight:'900',letterSpacing:.8},nextLabel:{color:'#777',fontSize:10,fontWeight:'900',letterSpacing:.8},title:{color:'#fff',fontSize:20,fontWeight:'900',marginTop:2},nextTitle:{color:'#fff',fontSize:16,fontWeight:'900',marginTop:2},detail:{color:'#898989',fontSize:12,fontWeight:'700',marginTop:2},divider:{height:1,backgroundColor:'#292929',marginVertical:12}})
