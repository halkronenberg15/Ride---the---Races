import { StyleSheet, Text, View } from 'react-native'
import type { OfficialCourseMarker } from '../../../src/data/courseMarkers'

function icon(type:OfficialCourseMarker['type']){
 if(type==='kom')return '▲'
 if(type==='sprint'||type==='bonus')return '⚡'
 if(type==='tt-check')return '◫'
 if(type==='finish')return '▥'
 return '•'
}
export default function CourseMarkerStrip({markers,distanceKm,courseKm}:{markers:OfficialCourseMarker[];distanceKm:number;courseKm:number}){
 if(!markers.length)return null
 return <View style={s.card}>
  <View style={s.head}><Text style={s.label}>COURSE MARKERS</Text><Text style={s.meta}>{courseKm.toFixed(1)} / {distanceKm.toFixed(1)} km</Text></View>
  <View style={s.track}>
   <View style={s.line}/>
   {markers.map(m=>{
    const x=Math.max(0,Math.min(100,(m.routeKm/Math.max(1,distanceKm))*100))
    const passed=courseKm>=m.routeKm
    return <View key={m.id} style={[s.marker,{left:x+'%'}]}>
     <Text style={[s.icon,passed&&s.iconPassed]}>{icon(m.type)}</Text>
     <Text numberOfLines={1} style={s.markerLabel}>{m.label}</Text>
    </View>
   })}
  </View>
 </View>
}
const s=StyleSheet.create({card:{padding:14,borderRadius:16,backgroundColor:'#111',borderWidth:1,borderColor:'#303030'},head:{flexDirection:'row',justifyContent:'space-between'},label:{color:'#858585',fontSize:10,fontWeight:'900',letterSpacing:1.1},meta:{color:'#777',fontSize:10,fontWeight:'800'},track:{height:72,marginTop:12,position:'relative'},line:{position:'absolute',left:0,right:0,top:19,height:2,backgroundColor:'#333'},marker:{position:'absolute',top:7,width:72,marginLeft:-36,alignItems:'center'},icon:{color:'#777',fontSize:16,fontWeight:'900'},iconPassed:{color:'#ff8b3d'},markerLabel:{color:'#aaa',fontSize:8,fontWeight:'800',marginTop:4,textAlign:'center'}})
