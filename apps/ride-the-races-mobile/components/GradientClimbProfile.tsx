import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg'
import { StyleSheet, Text, View } from 'react-native'

type ProfilePoint={distanceKm:number;elevationM:number}

function grade(a:ProfilePoint,b:ProfilePoint){const km=Math.max(.001,b.distanceKm-a.distanceKm);return ((b.elevationM-a.elevationM)/(km*1000))*100}
function gradeColor(g:number){
 if(g>=10)return '#d83b34'
 if(g>=7)return '#f46a00'
 if(g>=4)return '#e9a23b'
 if(g>0)return '#d7c76d'
 return '#4a9f70'
}

export default function GradientClimbProfile({points,progress}:{points:ProfilePoint[];progress:number}){
 const width=360,height=190,pad=16
 const minE=Math.min(...points.map(p=>p.elevationM)),maxE=Math.max(...points.map(p=>p.elevationM))
 const maxD=Math.max(1,...points.map(p=>p.distanceKm))
 const map=points.map(p=>({x:pad+(p.distanceKm/maxD)*(width-pad*2),y:height-pad-34-((p.elevationM-minE)/Math.max(1,maxE-minE))*(height-70)}))
 const idx=Math.max(0,Math.min(map.length-1,Math.round(progress*Math.max(0,map.length-1))))
 const rider=map[idx]??{x:pad,y:height-pad-34}
 const g=points[idx+1]?grade(points[idx],points[idx+1]):points[idx-1]?grade(points[idx-1],points[idx]):0
 const remain=Math.max(0,maxD-(points[idx]?.distanceKm??0))
 return <View style={s.card}>
  <View style={s.header}><View><Text style={s.label}>GRADIENT CLIMB VIEW</Text><Text style={s.title}>{g>0?g.toFixed(1)+'% current gradient':'Descending / level'}</Text></View><Text style={s.progress}>{Math.round(progress*100)}%</Text></View>
  <Svg width="100%" height={height} viewBox={'0 0 '+width+' '+height}>
   <Defs><LinearGradient id="mountainFill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#ffffff" stopOpacity=".18"/><Stop offset="1" stopColor="#ffffff" stopOpacity=".02"/></LinearGradient></Defs>
   <Line x1={pad} y1={height-pad-34} x2={width-pad} y2={height-pad-34} stroke="#353535" strokeWidth="1"/>
   {map.length>1&&<Path d={map.map((p,i)=>(i===0?'M':'L')+p.x+' '+p.y).join(' ')+' L '+map[map.length-1].x+' '+(height-pad-34)+' L '+map[0].x+' '+(height-pad-34)+' Z'} fill="url(#mountainFill)"/>}
   {map.slice(0,-1).map((p,i)=><Line key={i} x1={p.x} y1={p.y} x2={map[i+1].x} y2={map[i+1].y} stroke={gradeColor(grade(points[i],points[i+1]))} strokeWidth="7" strokeLinecap="round"/>)}
   <Line x1={rider.x} y1={rider.y-25} x2={rider.x} y2={height-pad-34} stroke="#fff" strokeWidth="2" opacity=".65"/>
   <Circle cx={rider.x} cy={rider.y} r="7" fill="#fff" stroke={gradeColor(g)} strokeWidth="3"/>
   <SvgText x={pad} y={height-10} fill="#777" fontSize="10">0 KM</SvgText>
   <SvgText x={width-70} y={height-10} fill="#777" fontSize="10">{maxD.toFixed(0)} KM</SvgText>
  </Svg>
  <View style={s.footer}><Metric label="CURRENT" value={(points[idx]?.elevationM??0).toFixed(0)+' m'}/><Metric label="TO FINISH" value={remain.toFixed(1)+' km'}/><Metric label="PEAK" value={maxE.toFixed(0)+' m'}/></View>
  <View style={s.legend}><Text style={s.legendText}>Gradient colors: easy rise → sustained → steep</Text></View>
 </View>
}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>}
const s=StyleSheet.create({card:{backgroundColor:'#111',borderWidth:1,borderColor:'#343434',borderRadius:18,padding:12},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},label:{color:'#929292',fontSize:10,fontWeight:'900',letterSpacing:1.3},title:{color:'#fff',fontSize:18,fontWeight:'900',marginTop:3},progress:{color:'#ff8b3d',fontWeight:'900',fontSize:13},footer:{flexDirection:'row',gap:8},metric:{flex:1,padding:9,borderRadius:10,backgroundColor:'#171717'},metricLabel:{color:'#777',fontSize:8,fontWeight:'900',letterSpacing:.8},metricValue:{color:'#fff',fontSize:13,fontWeight:'900',marginTop:2},legend:{paddingTop:8},legendText:{color:'#777',fontSize:10,fontWeight:'700'}})
