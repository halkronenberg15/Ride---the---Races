import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg'
import { StyleSheet, Text, View } from 'react-native'

type Point={x:number;y:number}
type Marker={x:number;label:string}

function pathFrom(points:Point[],width:number,height:number,padding=12){
 const innerW=width-padding*2,innerH=height-padding*2
 const mapped=points.map(p=>({x:padding+p.x*innerW,y:padding+(1-p.y)*innerH}))
 if(!mapped.length)return {line:'',area:'',mapped:[] as {x:number;y:number}[]}
 const line=mapped.map((p,i)=>(i===0?'M':'L')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ')
 const base=height-padding
 const area=line+' L '+mapped[mapped.length-1].x.toFixed(1)+' '+base+' L '+mapped[0].x.toFixed(1)+' '+base+' Z'
 return {line,area,mapped}
}

export default function ImmersiveRideProfile({
 points,progress,label,markers=[],currentLabel,nextLabel
}:{
 points:Point[]
 progress:number
 label:string
 markers?:Marker[]
 currentLabel?:string
 nextLabel?:string
}){
 const width=360,height=150
 const {line,area,mapped}=pathFrom(points,width,height)
 const idx=Math.max(0,Math.min(mapped.length-1,Math.round(progress*Math.max(0,mapped.length-1))))
 const rider=mapped[idx]??{x:12,y:height-12}
 return <View style={s.card}>
   <View style={s.header}><Text style={s.label}>{label}</Text><Text style={s.progress}>{Math.round(progress*100)}%</Text></View>
   <Svg width="100%" height={height} viewBox={'0 0 '+width+' '+height}>
     <Defs><LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#ff7a14" stopOpacity="0.55"/><Stop offset="1" stopColor="#ff7a14" stopOpacity="0.05"/></LinearGradient></Defs>
     <Line x1="12" y1={height-12} x2={width-12} y2={height-12} stroke="#343434" strokeWidth="1"/>
     {markers.map((m,i)=><Line key={i} x1={12+m.x*(width-24)} y1="12" x2={12+m.x*(width-24)} y2={height-12} stroke="#5b5b5b" strokeWidth="1" strokeDasharray="3 5"/>)}
     <Path d={area} fill="url(#fill)"/>
     <Path d={line} fill="none" stroke="#ff6a00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
     <Line x1={rider.x} y1={rider.y-24} x2={rider.x} y2={height-12} stroke="#fff" strokeWidth="2" opacity="0.75"/>
     <Circle cx={rider.x} cy={rider.y} r="7" fill="#fff" stroke="#ff6a00" strokeWidth="3"/>
     <SvgText x="12" y={height-1} fill="#777" fontSize="10">START</SvgText>
     <SvgText x={width-48} y={height-1} fill="#777" fontSize="10">FINISH</SvgText>
   </Svg>
   {(currentLabel||nextLabel)&&<View style={s.footer}>
     <View style={s.footerBlock}><Text style={s.footerLabel}>NOW</Text><Text numberOfLines={1} style={s.footerText}>{currentLabel??'—'}</Text></View>
     <View style={s.chev}><Text style={s.chevText}>›</Text></View>
     <View style={s.footerBlock}><Text style={s.footerLabel}>NEXT</Text><Text numberOfLines={1} style={s.footerText}>{nextLabel??'Finish'}</Text></View>
   </View>}
 </View>
}

const s=StyleSheet.create({
 card:{backgroundColor:'#111',borderWidth:1,borderColor:'#343434',borderRadius:18,padding:12},
 header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 label:{color:'#929292',fontSize:11,fontWeight:'900',letterSpacing:1.4},
 progress:{color:'#ff8b3d',fontWeight:'900',fontSize:13},
 footer:{flexDirection:'row',alignItems:'center',gap:8,paddingTop:4},
 footerBlock:{flex:1,minWidth:0},
 footerLabel:{color:'#707070',fontWeight:'900',fontSize:9,letterSpacing:1.2},
 footerText:{color:'#fff',fontWeight:'800',fontSize:13,marginTop:2},
 chev:{width:18,alignItems:'center'},
 chevText:{color:'#ff6a00',fontSize:24,fontWeight:'400'}
})
