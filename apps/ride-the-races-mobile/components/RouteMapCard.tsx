import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg'
import { StyleSheet, Text, View } from 'react-native'

type RoutePoint={x:number;y:number;label?:string}

export default function RouteMapCard({points=[],progress,alt}:{points?:RoutePoint[];progress:number;alt:string}){
 const width=360,height=180,pad=18
 const normalized=points.length?points:[{x:8,y:50},{x:24,y:45},{x:42,y:54},{x:61,y:47},{x:78,y:55},{x:94,y:49}]
 const mapped=normalized.map(p=>({x:pad+(p.x/100)*(width-pad*2),y:pad+(p.y/100)*(height-pad*2),label:p.label}))
 const idx=Math.max(0,Math.min(mapped.length-1,Math.round(progress*Math.max(0,mapped.length-1))))
 const rider=mapped[idx]??mapped[0]
 const poly=mapped.map(p=>p.x+','+p.y).join(' ')
 return <View style={s.card}>
  <View style={s.head}><View><Text style={s.label}>ROUTE MAP</Text><Text numberOfLines={1} style={s.title}>{alt}</Text></View><Text style={s.progress}>{Math.round(progress*100)}%</Text></View>
  <Svg width="100%" height={height} viewBox={'0 0 '+width+' '+height}>
   <Polyline points={poly} fill="none" stroke="#343434" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
   <Polyline points={poly} fill="none" stroke="#ff6a00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
   {mapped.map((p,i)=><Circle key={i} cx={p.x} cy={p.y} r={i===0||i===mapped.length-1?5:3} fill={i<=idx?'#fff':'#777'}/>)}
   {rider&&<><Circle cx={rider.x} cy={rider.y} r="8" fill="#fff" stroke="#ff6a00" strokeWidth="3"/><Line x1={rider.x} y1={rider.y-16} x2={rider.x} y2={rider.y-7} stroke="#ff6a00" strokeWidth="2"/></>}
   {mapped.filter(p=>p.label).map((p,i)=><SvgText key={'l'+i} x={p.x+5} y={Math.max(12,p.y-7)} fill="#aaa" fontSize="9">{p.label}</SvgText>)}
  </Svg>
 </View>
}
const s=StyleSheet.create({card:{backgroundColor:'#111',borderWidth:1,borderColor:'#343434',borderRadius:18,padding:12},head:{flexDirection:'row',justifyContent:'space-between',gap:12},label:{color:'#858585',fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:'#fff',fontSize:14,fontWeight:'800',marginTop:3,maxWidth:270},progress:{color:'#ff8b3d',fontSize:13,fontWeight:'900'}})
