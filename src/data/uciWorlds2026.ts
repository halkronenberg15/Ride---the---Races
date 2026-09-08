import type { OfficialCourseMarker } from './courseMarkers.ts'
import type { ProfessionalEvent } from './professionalRaces.ts'
import type { RaceStage, RideSegment } from './raceStages.ts'

export const WORLDS_UCI_REFERENCE='https://www.uci.org/pressrelease/200-days-to-go-a-look-at-the-courses-of-the-2026-uci-road-world/7MNCbBHZySudjNAoDW4R8x'
const SOURCE='UCI: 200 days to go — courses of the 2026 UCI Road World Championships'
const verification={profile:false,map:false,distance:true,ascent:true,markers:false,source:SOURCE,reference:WORLDS_UCI_REFERENCE,updatedAt:'2026-09-08'}
const map=(alt:string,points:Array<{x:number;y:number}>)=>({type:'simplified-route' as const,alt,verified:false,source:'Authored Ride the Races interpretation; route coordinates are not official UCI data.',points})

export const WORLDS_DURATIONS={itt:[30,40,50],road:[70,80,105]} as const
type Seed={name:string;type:string;weight:number;routeKm:number;zone:string;power:string;cadence:string;description:string}
function sectors(seeds:Seed[],minutes:number):RideSegment[]{
 const total=seeds.reduce((sum,item)=>sum+item.weight,0),seconds=minutes*60
 let used=0
 return seeds.map((item,index)=>{const sec=index===seeds.length-1?seconds-used:Math.round(seconds*item.weight/total);used+=sec;return {...item,sec,resistance:'Resolver-backed',icon:/cooldown/i.test(item.name)?'🌅':'🏁',objective:item.description,secondaryObjective:'Follow Jean’s synchronized pacing call.',terrainLabel:item.type,fixed:index===0?[{at:5,text:item.description}]:[],random:[]}})
}
const ittSeeds:Seed[]=[
 {name:'Start House',type:'ITT start',weight:2,routeKm:0,zone:'Z2',power:'70–78% FTP',cadence:'88–92 rpm',description:'Settle early. Do not spend the ride in the first kilometre.'},
 {name:'Opening Acceleration',type:'Pacing',weight:3,routeKm:2,zone:'Z3',power:'82–88% FTP',cadence:'88–94 rpm',description:'Build into the effort without a spike.'},
 {name:'Old Montréal Technical Rhythm',type:'Technical',weight:5,routeKm:6,zone:'Z3',power:'86–92% FTP',cadence:'90–96 rpm',description:'Technical section ahead. Hold speed and stay smooth.'},
 {name:'St. Lawrence Riverfront Power',type:'Power',weight:5,routeKm:12,zone:'Z4',power:'94–100% FTP',cadence:'88–94 rpm',description:'Long power section. Lock onto the number.'},
 {name:'Gilles-Villeneuve Speed',type:'Speed',weight:5,routeKm:19,zone:'Z4',power:'96–102% FTP',cadence:'92–98 rpm',description:'Stay aerodynamic and carry speed.'},
 {name:'Parc Jean-Drapeau',type:'Technical power',weight:4,routeKm:25,zone:'Z4',power:'96–102% FTP',cadence:'88–94 rpm',description:'Smooth through Parc Jean-Drapeau.'},
 {name:'Concorde Bridge',type:'Bridge',weight:3,routeKm:30,zone:'Z4',power:'100–105% FTP',cadence:'84–90 rpm',description:'Over the bridge, then empty the tank.'},
 {name:'Final Drive',type:'ITT finale',weight:3,routeKm:34,zone:'Z5',power:'105–112% FTP',cadence:'92–100 rpm',description:'Final drive. Everything left goes now.'},
 {name:'Cooldown',type:'Cooldown',weight:3,routeKm:39.2,zone:'Z1',power:'Under 55% FTP',cadence:'85–92 rpm',description:'Easy now. The clock has stopped.'},
]
const roadSeeds:Seed[]=[
 {name:'Brossard Rollout',type:'Rollout',weight:6,routeKm:0,zone:'Z1–Z2',power:'55–70% FTP',cadence:'88–94 rpm',description:'Settle into Team USA position.'},
 {name:'South Shore Positioning',type:'Flat',weight:6,routeKm:18,zone:'Z2',power:'70–78% FTP',cadence:'88–96 rpm',description:'The early move is forming on the South Shore.'},
 {name:'Montérégie Roads',type:'Rolling',weight:7,routeKm:42,zone:'Z2–Z3',power:'76–86% FTP',cadence:'84–92 rpm',description:'The peloton permits a controlled, simulated gap.'},
 {name:'Montréal Approach',type:'Chase',weight:6,routeKm:75,zone:'Z3',power:'84–92% FTP',cadence:'86–94 rpm',description:'The move is getting dangerous. Close it now.'},
 {name:'Samuel-De Champlain Bridge',type:'Positioning',weight:5,routeKm:100,zone:'Z3',power:'88–96% FTP',cadence:'82–90 rpm',description:'Bridge crossing. Position before the circuit.'},
 {name:'Mount Royal Circuit Entry',type:'Circuit entry',weight:5,routeKm:112.9,zone:'Z3',power:'86–94% FTP',cadence:'84–92 rpm',description:'MOUNT ROYAL. The break is reduced.'},
 {name:'Early Circuit Attrition',type:'Circuit laps 1–4',weight:7,routeKm:126.3,zone:'Z3',power:'82–94% FTP',cadence:'82–92 rpm',description:'Repeated ramps are thinning the field.'},
 {name:'Camillien-Houde Pressure',type:'Repeated climb',weight:7,routeKm:166.5,zone:'Z4',power:'96–105% FTP',cadence:'74–84 rpm',description:'Camillien-Houde. Absorb the selection.'},
 {name:'Polytechnique Selection',type:'Repeated ramps',weight:7,routeKm:206.7,zone:'Z4',power:'98–108% FTP',cadence:'72–84 rpm',description:'Polytechnique ramps exceed eleven percent.'},
 {name:'Late Circuit Racing',type:'Circuit laps 8–10',weight:7,routeKm:233.5,zone:'Z4',power:'95–105% FTP',cadence:'80–90 rpm',description:'Favorites are testing the reduced group.'},
 {name:'Final Mount Royal Selection',type:'Attack',weight:6,routeKm:260.3,zone:'Z5',power:'108–120% FTP',cadence:'82–94 rpm',description:'Late favorites attack. Follow the authored move or hold.'},
 {name:'Avenue du Parc Finish',type:'Final sprint',weight:4,routeKm:272.2,zone:'Z6',power:'120–150% FTP',cadence:'96–115 rpm',description:'Final lap. Rising Avenue du Parc. Build, position, launch, sprint.'},
 {name:'Cooldown',type:'Cooldown',weight:5,routeKm:273.7,zone:'Z1',power:'Under 55% FTP',cadence:'85–92 rpm',description:'Across the line. Cool down with Team USA.'},
]
const ittMarkers:OfficialCourseMarker[]=[8,16,24,32].map((routeKm,index)=>({id:`worlds-2026-itt-split-${index+1}`,type:'tt-check',routeKm,label:`SPLIT ${index+1}`,verified:true,source:{organization:'Ride the Races authored split',reference:WORLDS_UCI_REFERENCE,verifiedAt:'2026-09-08'}}))
const roadMarkers:OfficialCourseMarker[]=[{id:'worlds-2026-road-sprint',type:'sprint',routeKm:68,label:'SPRINT',verified:true,source:{organization:'Ride the Races authored marker',reference:WORLDS_UCI_REFERENCE,verifiedAt:'2026-09-08'}},{id:'worlds-2026-road-kom',type:'kom',routeKm:260.3,label:'MOUNT ROYAL',verified:true,source:{organization:'Ride the Races authored marker',reference:WORLDS_UCI_REFERENCE,verifiedAt:'2026-09-08'}}]
const profile=(distance:number,road=false)=>road?[0,30,65,100,112.9,126.3,139.7,153.1,166.5,179.9,193.3,206.7,220.1,233.5,246.9,260.3,273.7].map((distanceKm,i)=>({distanceKm,elevationM:i<4?25+i*8:55+(i%2?150:0)})):[0,4,8,12,16,20,24,28,32,36,distance].map((distanceKm,i)=>({distanceKm,elevationM:20+[0,10,4,15,3,6,2,17,4,25,12][i]}))
const lapProfile=[0,1.8,3.4,5.1,6.7,8.4,10.1,11.7,13.4].map((distanceKm,index)=>({distanceKm,elevationM:[55,84,205,72,61,118,58,96,55][index]}))
function stage(id:string,number:number,distanceKm:number,elevationM:number,seeds:Seed[],minutes:number,markers:OfficialCourseMarker[]):RaceStage{return {id,raceId:'worlds-2026',number,route:number===1?'Avenue du Parc → Montréal':'Brossard / Quartier DIX30 → Avenue du Parc',title:number===1?'Montréal Worlds — Elite Men ITT':'Montréal Worlds — Elite Men Road Race',distanceKm,elevationM,theme:number===1?'Individual Time Trial':'Road World Championship',difficulty:'Championship',objective:number===1?'Deliver a sustainable, precisely paced time trial.':'Race the authored Montréal situation without moving canonical course position.',teamOrders:['Represent Team USA.','Jean remains performance director.'],profilePoints:profile(distanceKm,number===2),profileVerified:false,profileSource:'Authored Ride the Races interpretation from official UCI totals and landmarks.',profileReference:WORLDS_UCI_REFERENCE,profileUpdatedAt:'2026-09-08',verification,workoutReady:true,officialCourseMarkers:markers,segments:sectors(seeds,minutes)}}
export function worldsStage(discipline:'itt'|'road',minutes?:number){return discipline==='itt'?stage('worlds-2026-elite-men-itt',1,39.2,220,ittSeeds,minutes??40,ittMarkers):stage('worlds-2026-elite-men-road',2,273.7,3803,roadSeeds,minutes??80,roadMarkers)}
export const worldsStages=[worldsStage('itt'),worldsStage('road')]

export const uciWorlds2026:ProfessionalEvent={id:'worlds-2026',kind:'championship',season:2026,name:'2026 UCI Road World Championships',location:'Montréal, Canada',identity:{shortName:'Worlds',raceAccentColor:'#2f5fa7',leaderJerseyColor:'#fff',sprintMarkerColor:'#ef3340',komMarkerColor:'#2f5fa7',finishMarkerColor:'#fff',kmZeroMarkerColor:'#ffd400',timeCheckMarkerColor:'#55dff7'},races:[{id:'men-elite-itt',name:'Elite Men Individual Time Trial',date:'2026-09-20',discipline:'individual-time-trial',course:{courseKind:'point-to-point',start:'Avenue du Parc, Montréal',finish:'central Montréal',distanceKm:39.2,profile:profile(39.2),map:map('Authored RtR interpretation of the Montréal Elite Men ITT landmarks',[{x:48,y:88},{x:25,y:76},{x:14,y:48},{x:29,y:18},{x:68,y:13},{x:86,y:43},{x:72,y:75},{x:52,y:87}]),verification,workoutReady:true}},{id:'men-elite-road-race',name:'Elite Men Road Race',date:'2026-09-27',discipline:'road-race',course:{courseKind:'circuit',start:'Brossard / Quartier DIX30',finish:'Avenue du Parc, Montréal',totalDistanceKm:273.7,lapDistanceKm:13.4,lapCount:12,lapProfile,lapMap:map('Authored RtR interpretation of the Mount Royal final circuit',[{x:53,y:87},{x:28,y:78},{x:15,y:51},{x:31,y:19},{x:65,y:15},{x:85,y:42},{x:76,y:72},{x:53,y:87}]),verification,workoutReady:true}}]}
