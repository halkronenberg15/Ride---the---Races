import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { CloudCareerSnapshot } from '../lib/cloudCareer'

const TARGET=new Date('2028-07-01T00:00:00')
function daysUntilTarget(){return Math.max(0,Math.ceil((TARGET.getTime()-Date.now())/86400000))}

function TeamBusArt(){
 return <View style={s.busScene}>
  <View style={s.skyGlow}/>
  <View style={s.bus}>
   <View style={s.busTop}><Text style={s.busBrand}>TEAM LORIOT</Text></View>
   <View style={s.windows}>{[1,2,3,4,5].map(x=><View key={x} style={s.window}/>)}</View>
   <View style={s.busStripe}/><View style={s.busDoor}/>
   <View style={[s.wheel,{left:38}]}/><View style={[s.wheel,{right:38}]}/>
  </View>
  <View style={s.awning}/>
  <View style={s.bikes}>{[1,2,3].map(x=><View key={x} style={s.bike}><View style={s.bikeWheel}/><View style={s.bikeFrame}/><View style={s.bikeWheel}/></View>)}</View>
  <Text style={s.sceneCaption}>THE TEAM BUS · MISSION FRANCE</Text>
 </View>
}

export default function MissionFranceLandingScreen({career,riderName,ftp,rideCount,onEnterHQ,onOpenTraining}:{career:CloudCareerSnapshot|null;riderName:string;ftp:number|null;rideCount:number;onEnterHQ:()=>void;onOpenTraining:()=>void}){
 const assignments=career?.alpha4025?.trainingPlan?.weeks.flatMap(week=>week.assignments)??[]
 const now=new Date(),today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-')
 const todayItems=assignments.filter(item=>item.date===today&&(item.status==='PLANNED'||item.status==='REPLACED')&&Number(item.durationMinutes??0)>0)
 const monthKey=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0')].join('-'),firstDay=new Date(now.getFullYear(),now.getMonth(),1).getDay(),daysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(),cells=[...Array(firstDay).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)],plannedDates=new Set(assignments.filter(item=>item.date.startsWith(monthKey)&&Number(item.durationMinutes??0)>0).map(item=>item.date))
 return <ScrollView contentContainerStyle={s.wrap}>
  <View style={s.brand}><Text style={s.team}>TEAM</Text><Text style={s.loriot}>// LORIOT</Text><Text style={s.mission}>MISSION FRANCE 2028</Text></View>
  <TeamBusArt/>
  <View style={s.countRow}><View><Text style={s.count}>{daysUntilTarget()}</Text><Text style={s.countLabel}>DAYS TO FRANCE</Text></View><View style={s.riderMini}><Text style={s.miniLabel}>RIDER</Text><Text style={s.miniName}>{riderName}</Text><Text style={s.miniMeta}>FTP {ftp??'—'} W · {rideCount} rides</Text></View></View>

  <Pressable style={s.enter} onPress={onEnterHQ}><Text style={s.enterIcon}>↪</Text><View style={{flex:1}}><Text style={s.enterTitle}>ENTER TEAM BUS</Text><Text style={s.enterSub}>Plan · Prepare · Fuel · Race</Text></View><Text style={s.enterArrow}>›</Text></Pressable>

  <View style={s.calendarCard}>
   <View style={s.calendarHead}><View><Text style={s.label}>MISSION CALENDAR</Text><Text style={s.calendarTitle}>{new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(now)}</Text></View><Pressable onPress={onOpenTraining}><Text style={s.calendarLink}>Full plan ›</Text></Pressable></View>
   <View style={s.weekdays}>{['S','M','T','W','T','F','S'].map((day,index)=><Text key={day+index} style={s.weekday}>{day}</Text>)}</View>
   <View style={s.calendarGrid}>{cells.map((day,index)=>{if(day===null)return <View key={'blank'+index} style={s.dayCell}/>;const date=monthKey+'-'+String(day).padStart(2,'0'),isToday=date===today,planned=plannedDates.has(date);return <View key={date} style={[s.dayCell,isToday&&s.todayCell]}><Text style={[s.dayNum,isToday&&s.todayNum]}>{day}</Text>{planned&&<View style={s.planDot}/>}</View>})}</View>
  </View>

  <Pressable style={s.today} onPress={onOpenTraining}><Text style={s.todayLabel}>TODAY'S PROGRAM</Text>{todayItems.length?todayItems.map(item=><Text key={item.id} style={s.todayTitle}>{item.title} · {item.durationMinutes} min</Text>):<Text style={s.todayTitle}>Recovery / no planned workload</Text>}<Text style={s.todayAction}>OPEN TRAINING ›</Text></Pressable>
 </ScrollView>
}

const s=StyleSheet.create({
 wrap:{padding:18,gap:14,backgroundColor:'#080a0c'},brand:{paddingTop:4},team:{color:'#ff6a00',fontWeight:'900',letterSpacing:7,fontSize:12,marginLeft:46},loriot:{color:'#fff',fontWeight:'900',fontStyle:'italic',fontSize:39,letterSpacing:-1},mission:{color:'#bbb',letterSpacing:4,fontSize:10,marginLeft:47,marginTop:-3},
 busScene:{height:265,borderRadius:26,overflow:'hidden',backgroundColor:'#111922',borderWidth:1,borderColor:'#3a2b20',position:'relative'},skyGlow:{position:'absolute',top:-60,right:-20,width:220,height:180,borderRadius:120,backgroundColor:'#263746'},bus:{position:'absolute',left:18,right:18,top:72,height:128,borderRadius:18,backgroundColor:'#e7e7e5',borderWidth:4,borderColor:'#171717',overflow:'hidden'},busTop:{height:30,backgroundColor:'#121518',justifyContent:'center',paddingLeft:16},busBrand:{color:'#fff',fontWeight:'900',fontStyle:'italic',letterSpacing:1.5},windows:{height:46,flexDirection:'row',gap:3,padding:5,backgroundColor:'#1a1d20'},window:{flex:1,backgroundColor:'#39434a',borderRadius:3},busStripe:{position:'absolute',left:0,right:0,bottom:30,height:8,backgroundColor:'#ff6a00'},busDoor:{position:'absolute',right:18,bottom:0,width:30,height:56,backgroundColor:'#24282b'},wheel:{position:'absolute',bottom:-14,width:38,height:38,borderRadius:20,backgroundColor:'#050505',borderWidth:7,borderColor:'#292929'},awning:{position:'absolute',left:20,right:55,top:58,height:7,backgroundColor:'#ff7b1a',transform:[{rotate:'-2deg'}]},bikes:{position:'absolute',left:50,right:50,bottom:28,flexDirection:'row',justifyContent:'space-between'},bike:{flexDirection:'row',alignItems:'center'},bikeWheel:{width:24,height:24,borderRadius:12,borderWidth:3,borderColor:'#cfcfcf'},bikeFrame:{width:22,height:3,backgroundColor:'#ff6a00',transform:[{rotate:'-14deg'}]},sceneCaption:{position:'absolute',left:18,bottom:8,color:'#8b8f93',fontSize:9,fontWeight:'900',letterSpacing:1.5},
 countRow:{flexDirection:'row',gap:12},countRowChild:{flex:1},count:{color:'#ff6a00',fontSize:52,fontWeight:'900',lineHeight:54},countLabel:{color:'#74777a',fontSize:10,fontWeight:'900',letterSpacing:1.5},riderMini:{flex:1,padding:13,borderRadius:16,backgroundColor:'#121416',borderWidth:1,borderColor:'#2e3133'},miniLabel:{color:'#ff8b3d',fontSize:9,fontWeight:'900',letterSpacing:1.5},miniName:{color:'#fff',fontSize:18,fontWeight:'900',marginTop:2},miniMeta:{color:'#85888b',fontSize:11,marginTop:2},
 enter:{flexDirection:'row',alignItems:'center',gap:12,padding:18,borderRadius:22,backgroundColor:'#ff6a00'},enterIcon:{color:'#120b06',fontSize:30,fontWeight:'900'},enterTitle:{color:'#0c0c0c',fontSize:20,fontWeight:'900',letterSpacing:1.4},enterSub:{color:'#4b2109',fontSize:11,fontWeight:'800',marginTop:2},enterArrow:{color:'#0c0c0c',fontSize:36,fontWeight:'900'},
 calendarCard:{padding:16,borderRadius:20,backgroundColor:'#121416',borderWidth:1,borderColor:'#2e3133',gap:9},calendarHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},label:{color:'#ff8b3d',fontWeight:'900',letterSpacing:1.4,fontSize:10},calendarTitle:{color:'#fff',fontWeight:'900',fontSize:18,marginTop:2},calendarLink:{color:'#ff8b3d',fontWeight:'800'},weekdays:{flexDirection:'row'},weekday:{width:'14.285%',textAlign:'center',color:'#5f6366',fontSize:10,fontWeight:'900'},calendarGrid:{flexDirection:'row',flexWrap:'wrap'},dayCell:{width:'14.285%',aspectRatio:1,alignItems:'center',justifyContent:'center',gap:2},todayCell:{borderRadius:999,backgroundColor:'#ff6a00'},dayNum:{color:'#a4a7aa',fontWeight:'800'},todayNum:{color:'#fff'},planDot:{width:4,height:4,borderRadius:2,backgroundColor:'#ff8b3d'},
 today:{padding:18,borderRadius:20,backgroundColor:'#14100d',borderWidth:1,borderColor:'#5a3018',gap:4},todayLabel:{color:'#ff8b3d',fontWeight:'900',letterSpacing:1.3,fontSize:10},todayTitle:{color:'#fff',fontSize:18,fontWeight:'900'},todayAction:{color:'#ff8b3d',fontWeight:'900',marginTop:4}
})