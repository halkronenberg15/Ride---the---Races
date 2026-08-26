import type { RaceStage, RideSegment } from './raceStages.ts'
import type { CourseProfilePoint } from './courseProfile.ts'
import { authorWorkout, vueltaWorkoutDefinitions } from './grandTourWorkouts.ts'
import type { OfficialCourseMarker } from './courseMarkers.ts'

export type CourseVerification={profile:boolean;distance:boolean;ascent:boolean;markers:boolean;map:boolean;source:string;reference:string;updatedAt:string}
export type RouteMap={type:'asset'|'simplified-route';asset?:string;alt:string;verified:boolean;source:string;points?:Array<{x:number;y:number;label?:string}>}
export type RaceIdentity={shortName:string;raceAccentColor:string;leaderJerseyColor:string;sprintMarkerColor:string;komMarkerColor:string;finishMarkerColor:string;kmZeroMarkerColor:string;timeCheckMarkerColor:string}
export type ProfessionalStage={number:number;date:string;start:string;finish:string;classification:string;type:string;officialDistanceKm:number;distanceKm:number;officialAscentM:number;indoorDurationMinutes?:number;plannedDurationMinutes?:number;mission:string;profilePoints:Array<{distanceKm:number;elevationM:number}>;verification:CourseVerification;workoutReady:boolean;rideable:boolean;stageMap:RouteMap;officialCourseMarkers?:OfficialCourseMarker[];segments:RideSegment[]}
export type ProfessionalRace={id:string;season:number;name:string;shortName:string;startDate:string;endDate:string;identity:RaceIdentity;routeMap:RouteMap;stages:ProfessionalStage[];restDays:Array<{afterStage:number;date:string;label:string}>}
export type ProfessionalCourse={courseKind:'point-to-point'|'circuit';start:string;finish:string;distanceKm?:number;totalDistanceKm?:number;lapDistanceKm?:number;lapCount?:number;profile?:CourseProfilePoint[];lapProfile?:CourseProfilePoint[];map?:RouteMap;lapMap?:RouteMap;verification:CourseVerification;workoutReady:boolean}
export type ChampionshipRace={id:string;name:string;date?:string;discipline:'individual-time-trial'|'road-race';course:ProfessionalCourse}
export type ProfessionalEvent={id:string;kind:'championship';season:number;name:string;location:string;identity:RaceIdentity;races:ChampionshipRace[]}

const SOURCE='Official La Vuelta 2026 overall route and stage profile materials'
const REFERENCE='https://www.lavuelta.es/en/overall-route'
const verified=(map=false):CourseVerification=>({profile:true,distance:true,ascent:true,markers:false,map,source:SOURCE,reference:REFERENCE,updatedAt:'2026-08-15'})
const map=(alt:string):RouteMap=>({type:'simplified-route',alt,verified:false,source:SOURCE,points:[{x:8,y:51},{x:25,y:46},{x:44,y:53},{x:63,y:47},{x:82,y:55},{x:94,y:49}]})
const raw:Array<[string,string,string,string,number,number,number[],number[]]> = [
['2026-08-22','Monaco','Monaco','Individual time trial',9.4,90,[0,0.5,1.2,2,3,4.2,5.6,6.8,7.8,8.7,9.4],[48,72,68,72,28,6,5,7,4,7,5]],
['2026-08-23','Monaco','Manosque','Hilly',214,3060,[0,12,28,45,62,78,96,112,130,148,165,181,198,214],[180,20,120,260,160,380,210,520,280,700,330,610,360,420]],
['2026-08-24','Gruissan / Aude','Font-Romeu','Medium mountains',174,2660,[0,18,38,58,78,98,108,120,132,142,151,160,168,174],[8,35,22,80,48,110,180,340,560,820,1060,1320,1580,1780]],
['2026-08-25','Andorra la Vella','Andorra la Vella','Mountain',104.8,2890,[0,6,14,23,34,43,51,61,70,78,88,96,104.8],[1020,1450,2380,1720,1050,1540,2050,1380,980,1480,2110,1450,1020]],
['2026-08-26','Falset / Costa Daurada',"Roquetes / Terres de l’Ebre",'Hilly',173.4,1690,[0,10,20,32,48,68,88,106,120,132,141,149,158,166,173.4],[360,610,410,690,240,180,130,190,120,380,160,820,430,180,45]],
['2026-08-27','Alcossebre','Castelló','Medium mountains',177.4,3080,[0,13,27,40,54,67,80,94,108,121,135,146,157,166,177.4],[35,650,210,920,380,1100,440,70,590,120,680,190,1050,410,35]],
['2026-08-28',"Vall d’Alba",'Aramón Valdelinares','Mountain',149.8,3750,[0,12,24,37,50,63,76,88,100,111,121,131,139,145,149.8],[300,620,480,850,650,1050,780,1180,920,1350,1080,1280,1510,1780,1980]],
['2026-08-29','Puçol','Xeraco','Flat',171,1270,[0,18,36,54,72,90,108,124,138,146,149,154,161,171],[20,120,80,260,150,420,130,55,80,120,610,280,70,8]],
['2026-08-30','La Vila Joiosa / Villajoyosa','Alto de Aitana','Mountain',187.4,4940,[0,12,25,38,51,64,78,91,104,117,130,143,156,166,174,181,187.4],[15,620,150,980,210,1120,260,920,180,1050,240,850,130,240,610,1080,1530]],
['2026-09-01','Alcaraz','Elche de la Sierra','Hilly',185,2720,[0,16,31,46,61,77,92,108,124,140,154,163,173,185],[960,1120,900,1250,980,1330,1040,1210,890,710,590,1040,720,680]],
['2026-09-02','Cartagena','Lorca','Hilly',151,1310,[0,18,36,54,72,90,105,116,121,127,137,151],[20,35,70,130,220,310,260,180,690,420,260,320]],
['2026-09-03','Vera','Calar Alto','Mountain',167,4530,[0,12,25,38,51,65,79,93,107,120,128,137,145,153,160,167],[15,420,180,720,330,980,510,1180,460,720,430,1820,1050,760,1430,2140]],
['2026-09-04','Almuñécar','Loja','Medium mountains',193,3410,[0,10,20,31,44,61,80,97,115,132,146,155,166,178,193],[10,520,1050,1420,720,980,1510,1180,1260,940,710,1280,820,420,260]],
['2026-09-05','Jaén','Sierra de la Pandera','Mountain',155,4170,[0,13,27,41,55,69,82,93,104,116,127,137,145,150,155],[540,910,650,1120,760,1280,920,1450,860,1320,910,1510,1100,1510,1820]],
['2026-09-06','Palma del Río','Córdoba','Medium mountains',190,3130,[0,18,36,53,68,82,96,109,122,136,149,161,173,182,190],[55,80,140,520,220,650,260,720,310,780,360,690,250,120,95]],
['2026-09-08','Cortegana','La Rábida / Palos de la Frontera','Hilly',182,1980,[0,9,20,34,49,64,80,96,112,126,142,158,172,182],[600,820,680,760,560,620,420,370,210,90,55,35,20,12]],
['2026-09-09','Dos Hermanas','Sevilla','Flat',185,890,[0,18,30,46,65,82,99,108,121,135,151,168,185],[35,40,150,230,120,45,40,120,210,130,45,25,18]],
['2026-09-10','El Puerto de Santa María','Jerez de la Frontera','Individual time trial',32.5,190,[0,3,6,9,12,15,18,20,22,24,27,30,32.5],[5,8,12,18,22,20,25,40,22,42,28,38,48]],
['2026-09-11','Vélez-Málaga','Peñas Blancas / Estepona','Mountain',210,4190,[0,18,38,58,75,82,91,100,112,124,138,151,162,171,181,190,198,204,210],[20,45,80,130,180,520,1280,680,1450,950,1120,760,420,15,20,90,420,850,1260]],
['2026-09-12','La Calahorra','Collado del Alguacil','Mountain',187,4850,[0,12,25,38,51,62,76,86,95,106,116,126,137,147,156,166,171,179,187],[1180,1420,1160,1680,2250,1480,1820,1390,2320,1510,1760,2260,1470,1810,2380,1420,1310,1650,1980]],
['2026-09-13','Carrefour Granada','Granada','Hilly circuit',112,1280,[0,8,17,24,30,38,47,55,64,72,78,83,88,93,98,103,108,112],[690,780,920,1080,1150,900,700,620,710,780,650,840,660,850,670,860,680,700]]
]
export const vuelta2026:ProfessionalRace={id:'vuelta-2026',season:2026,name:'La Vuelta',shortName:'La Vuelta',startDate:'2026-08-22',endDate:'2026-09-13',identity:{shortName:'La Vuelta',raceAccentColor:'#d62f38',leaderJerseyColor:'#d62f38',sprintMarkerColor:'#00a6a6',komMarkerColor:'#ef3340',finishMarkerColor:'#fff',kmZeroMarkerColor:'#ffd400',timeCheckMarkerColor:'#55dff7'},routeMap:{...map('Simplified overview of the 2026 La Vuelta route from Monaco to Granada'),points:[{x:8,y:49,label:'Monaco'},{x:24,y:54},{x:41,y:45},{x:59,y:52},{x:76,y:46},{x:94,y:51,label:'Granada'}]},restDays:[{afterStage:9,date:'2026-08-31',label:'Rest Day 1'},{afterStage:15,date:'2026-09-07',label:'Rest Day 2'}],stages:raw.map(([date,start,finish,classification,distance,ascent,distances,elevations],i)=>{
 const profilePoints=distances.map((distanceKm,j)=>({distanceKm,elevationM:elevations[j]})); const definition=vueltaWorkoutDefinitions[i]; const segments=authorWorkout(profilePoints,definition.sections); const duration=Math.round(segments.reduce((sum,segment)=>sum+segment.sec,0)/60)
 const officialCourseMarkers:OfficialCourseMarker[]|undefined=i===0?[{id:'vuelta-2026-s1-tt-check-1',type:'tt-check',routeKm:5.6,label:'TT CHECK',verified:true,source:{organization:'La Vuelta',reference:REFERENCE,verifiedAt:'2026-08-15'}}]:undefined
 return {number:i+1,date,start,finish,classification,type:classification,officialDistanceKm:distance,distanceKm:distance,officialAscentM:ascent,indoorDurationMinutes:duration,plannedDurationMinutes:duration,mission:definition.mission,profilePoints,verification:{...verified(false),markers:Boolean(officialCourseMarkers?.length)},workoutReady:true,rideable:true,stageMap:map(`Simplified route map for La Vuelta Stage ${i+1}, ${start} to ${finish}`),officialCourseMarkers,segments}
})}

export const toRaceStage=(race:ProfessionalRace,stage:ProfessionalStage):RaceStage=>({id:`${race.id}-stage-${stage.number}`,raceId:race.id,number:stage.number,route:`${stage.start} → ${stage.finish}`,title:`${stage.start} to ${stage.finish}`,distanceKm:stage.officialDistanceKm,elevationM:stage.officialAscentM,theme:stage.classification,difficulty:/mountain/i.test(stage.classification)?'9/10':'7/10',objective:stage.mission,teamOrders:['Protect position.','Follow Jean’s synchronized targets.'],profilePoints:stage.profilePoints.map(point=>({...point})),profileVerified:stage.verification.profile,profileSource:stage.verification.source,profileReference:stage.verification.reference,profileUpdatedAt:stage.verification.updatedAt,verification:stage.verification,workoutReady:stage.workoutReady,officialCourseMarkers:stage.officialCourseMarkers,segments:stage.segments})
export const vueltaRideStages=vuelta2026.stages.map(stage=>toRaceStage(vuelta2026,stage))
export { tour2026 } from './tour2026.ts'
export { uciWorlds2026 } from './uciWorlds2026.ts'
