import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'
function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}

function BusInterior(){
 return <View style={s.interior}>
  <View style={s.ceiling}><View style={s.light}/><View style={s.light}/></View>
  <View style={s.aisle}/>
  <View style={s.seats}>{[0,1,2].map(row=><View key={row} style={s.seatRow}><View style={s.seat}><Text style={s.seatLogo}>⌄</Text></View><View style={s.seat}><Text style={s.seatLogo}>⌄</Text></View></View>)}</View>
  <View style={s.kitchen}><Text style={s.kitchenTitle}>TEAM LORIOT</Text><View style={s.screen}><Text style={s.screenRoute}>●━━●━━●</Text><Text style={s.screenText}>TODAY'S ROUTE</Text></View></View>
  <Text style={s.insideLabel}>INSIDE THE TEAM BUS</Text>
 </View>
}

export default function HomeScreen({career,riderName,ftp,rideCount,onBackMission,onTraining,onNutrition,onLibrary,onProfile,onRide,onSignOut}:{career:CloudCareerSnapshot|null;riderName:string;ftp:number|null;rideCount:number;onBackMission:()=>void;onTraining:()=>void;onNutrition:()=>void;onLibrary:()=>void;onProfile:()=>void;onRide:()=>void;onSignOut:()=>void}){
 const today=localDate(),assignments=career?.alpha4025?.trainingPlan?.weeks.flatMap(w=>w.assignments)??[],todayItems=assignments.filter(x=>x.date===today&&(x.status==='PLANNED'||x.status==='REPLACED')&&Number(x.durationMinutes??0)>0)
 return <ScrollView contentContainerStyle={s.wrap}>
  <View style={s.header}><View><Pressable onPress={onBackMission}><Text style={s.back}>‹ Mission France</Text></Pressable><Text style={s.team}>TEAM</Text><Text style={s.logo}>// LORIOT</Text><Text style={s.hq}>TEAM HQ</Text></View><Pressable onPress={onSignOut}><Text style={s.link}>Sign out</Text></Pressable></View>
  <BusInterior/>
  <View style={s.status}><View><Text style={s.statusLabel}>RIDER</Text><Text style={s.statusValue}>{riderName}</Text></View><View><Text style={s.statusLabel}>FTP</Text><Text style={s.statusValue}>{ftp??'—'} W</Text></View><View><Text style={s.statusLabel}>RIDES</Text><Text style={s.statusValue}>{rideCount}</Text></View></View>

  <Pressable style={s.today} onPress={onTraining}><Text style={s.todayLabel}>TODAY'S TRAINING</Text>{todayItems.length?todayItems.map(x=><Text key={x.id} style={s.todayTitle}>{x.title} · {x.durationMinutes} min</Text>):<Text style={s.todayTitle}>Recovery / no planned workload</Text>}<Text style={s.todayAction}>OPEN PROGRAM ›</Text></Pressable>

  <View style={s.grid}>
   <Nav icon="▣" title="TRAINING CALENDAR" subtitle="Plan · Train · Perform" onPress={onTraining}/>
   <Nav icon="♨" title="NUTRITION" subtitle="Fuel · Recover · Adapt" onPress={onNutrition}/>
   <Nav icon="◎" title="RIDER PASSPORT" subtitle="Stats · Bio · Progress" onPress={onProfile}/>
   <Nav icon="⌁" title="RACE LIBRARY" subtitle="Routes · Briefings · Tactics" onPress={onLibrary}/>
  </View>

  <Pressable style={s.utility} onPress={onRide}><Text style={s.utilityTitle}>GPS RIDE COCKPIT</Text><Text style={s.utilityText}>Outdoor ride tools live in the equipment bay. Open planned workouts from Training and race stages from Race Library.</Text><Text style={s.utilityArrow}>›</Text></Pressable>
 </ScrollView>
}
function Nav({icon,title,subtitle,onPress}:{icon:string;title:string;subtitle:string;onPress:()=>void}){return <Pressable style={s.navCard} onPress={onPress}><View style={s.navArt}><Text style={s.navIcon}>{icon}</Text><View style={s.navGlow}/></View><View style={s.navCopy}><Text style={s.navTitle}>{title}</Text><Text style={s.navSub}>{subtitle}</Text></View><Text style={s.arrow}>›</Text></Pressable>}

const s=StyleSheet.create({
 wrap:{padding:18,gap:14,backgroundColor:'#080a0c'},header:{flexDirection:'row',justifyContent:'space-between'},back:{color:'#8f9396',fontWeight:'800',marginBottom:5},team:{color:'#ff6a00',fontSize:10,fontWeight:'900',letterSpacing:5,marginLeft:34},logo:{color:'#fff',fontSize:30,fontWeight:'900',fontStyle:'italic'},hq:{color:'#ff8b3d',fontSize:11,fontWeight:'900',letterSpacing:3,marginLeft:34},link:{color:'#ff8b3d',fontWeight:'700',paddingTop:8},
 interior:{height:270,borderRadius:24,overflow:'hidden',backgroundColor:'#17191c',borderWidth:1,borderColor:'#49301f',position:'relative'},ceiling:{height:38,backgroundColor:'#090a0b',flexDirection:'row',justifyContent:'space-around',paddingTop:14},light:{height:3,width:100,backgroundColor:'#ff6a00',borderRadius:3},aisle:{position:'absolute',top:38,bottom:0,left:'42%',width:'16%',backgroundColor:'#242424',borderLeftWidth:2,borderRightWidth:2,borderColor:'#ff6a00'},seats:{position:'absolute',left:16,width:'40%',top:55,gap:12},seatRow:{flexDirection:'row',gap:8},seat:{width:52,height:52,borderRadius:12,backgroundColor:'#08090a',borderWidth:1,borderColor:'#4b4d50',alignItems:'center',justifyContent:'center'},seatLogo:{color:'#ff6a00',fontWeight:'900',fontSize:20},kitchen:{position:'absolute',right:14,top:58,width:'36%',height:145,borderRadius:14,backgroundColor:'#111315',borderWidth:1,borderColor:'#333',padding:10},kitchenTitle:{color:'#ff8b3d',fontSize:9,fontWeight:'900',letterSpacing:1},screen:{marginTop:12,padding:8,borderRadius:8,backgroundColor:'#050607'},screenRoute:{color:'#ff6a00',fontSize:15},screenText:{color:'#888',fontSize:7,fontWeight:'900',marginTop:4},insideLabel:{position:'absolute',left:16,bottom:13,color:'#fff',fontWeight:'900',fontStyle:'italic',fontSize:20},
 status:{flexDirection:'row',justifyContent:'space-between',padding:14,borderRadius:16,backgroundColor:'#121416',borderWidth:1,borderColor:'#2d3032'},statusLabel:{color:'#74787b',fontSize:9,fontWeight:'900',letterSpacing:1.2},statusValue:{color:'#fff',fontSize:14,fontWeight:'900',marginTop:2},
 today:{padding:18,borderRadius:20,backgroundColor:'#ff6a00',gap:4},todayLabel:{color:'#2a1104',fontWeight:'900',letterSpacing:1.4,fontSize:10},todayTitle:{color:'#fff',fontSize:19,fontWeight:'900'},todayAction:{color:'#fff',fontWeight:'900',marginTop:4},
 grid:{gap:10},navCard:{height:94,borderRadius:18,backgroundColor:'#121416',borderWidth:1,borderColor:'#2f3234',flexDirection:'row',alignItems:'center',overflow:'hidden'},navArt:{width:94,height:'100%',backgroundColor:'#1a1d20',alignItems:'center',justifyContent:'center',position:'relative'},navGlow:{position:'absolute',width:55,height:55,borderRadius:30,backgroundColor:'#3d2414',opacity:.6},navIcon:{color:'#ff6a00',fontSize:32,fontWeight:'900',zIndex:2},navCopy:{flex:1,paddingLeft:14},navTitle:{color:'#fff',fontSize:15,fontWeight:'900'},navSub:{color:'#8f9396',fontSize:12,marginTop:4},arrow:{color:'#fff',fontSize:30,paddingRight:14},
 utility:{padding:17,borderRadius:17,borderWidth:1,borderColor:'#4a2a16',backgroundColor:'#100d0b',position:'relative'},utilityTitle:{color:'#ff8b3d',fontWeight:'900'},utilityText:{color:'#888',fontSize:12,lineHeight:18,marginTop:5,paddingRight:28},utilityArrow:{position:'absolute',right:15,top:28,color:'#ff8b3d',fontSize:30}
})