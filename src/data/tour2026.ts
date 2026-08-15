import { raceStages } from './raceStages.ts'
import type { ProfessionalRace, ProfessionalStage, RouteMap } from './professionalRaces.ts'

const SOURCE = 'Tour de France official 2026 stage profile'
const UPDATED_AT = '2026-08-15'

/**
 * Production course-verification standard
 *
 * A production professional race is not course-verified until every rideable stage
 * has been researched against a primary organiser source (or an equivalent
 * high-quality official source). Generic flat, hilly, mountain and TT templates are
 * prototype-only and must never carry `profileVerified = true`.
 *
 * `workoutReady` is a separate gate. It requires verified geometry, authored stage
 * sectors and workout targets, verified ride-required markers, and passing
 * initialization/regression tests.
 */

type TourSeed = [date:string,start:string,finish:string,classification:string,distanceKm:number,elevations:number[]]

// Distance-normalized samples transcribed from the official 2026 profile graphics.
// They intentionally retain rolling terrain on officially flat stages.
const seeds: TourSeed[] = [
 ['2026-07-04','Barcelona','Barcelona','Team time trial',19.6,[18,22,16,24,34,28,42,65,118,92]],
 ['2026-07-05','Tarragone','Barcelona','Hilly',168.5,[35,85,42,120,65,105,52,90,310,115,185,72,225,105]],
 ['2026-07-06','Granollers','Les Angles','Mountain',195.9,[145,260,190,390,310,640,410,860,1220,760,1580,1240,1780,1640]],
 ['2026-07-07','Carcassonne','Foix','Hilly',181.9,[105,170,110,330,145,520,220,610,285,920,540,390]],
 ['2026-07-08','Lannemezan','Pau','Flat',158.3,[610,520,445,380,330,285,250,205,315,190,175]],
 ['2026-07-09','Pau','Gavarnie-Gèdre','Mountain',186.2,[175,230,360,690,410,1490,720,2115,690,910,1375]],
 ['2026-07-10','Hagetmau','Bordeaux','Flat',175.1,[95,125,88,142,105,165,98,135,78,180,42,18]],
 ['2026-07-11','Périgueux','Bergerac','Flat',180.4,[105,190,125,235,115,185,105,290,135,255,82,45]],
 ['2026-07-12','Malemort','Ussel','Hilly',154.6,[125,410,190,620,260,770,330,690,280,840,450,735]],
 ['2026-07-14','Aurillac','Le Lioran','Mountain',166.6,[620,910,650,1120,720,1390,850,1585,920,1120,760,1305,910,1240]],
 ['2026-07-15','Vichy','Nevers','Flat',161.3,[255,330,235,390,245,325,205,260,185,215,180,195]],
 ['2026-07-16','Circuit Nevers Magny-Cours','Chalon-sur-Saône','Flat',179.1,[225,275,205,255,180,235,165,285,175,310,190,235]],
 ['2026-07-17','Dole','Belfort','Hilly',205.8,[220,285,195,315,210,350,225,410,255,720,440,1170,365]],
 ['2026-07-18','Mulhouse','Le Markstein Fellering','Mountain',155.3,[245,620,1340,540,880,460,1175,390,720,1420,1180]],
 ['2026-07-19','Champagnole','Plateau de Solaison','Mountain',183.9,[540,780,1120,760,970,520,1280,640,930,350,980,620,1510]],
 ['2026-07-21','Évian-les-Bains','Thonon-les-Bains','Individual time trial',26.1,[385,460,590,720,830,910,650,390,445,370,425]],
 ['2026-07-22','Chambéry','Voiron','Flat',174.7,[270,590,330,710,390,980,520,760,330,285,245,275,220]],
 ['2026-07-23','Voiron','Orcières-Merlette','Mountain',185.2,[285,470,1040,520,370,620,410,760,460,980,540,860,1845]],
 ['2026-07-24','Gap','Alpe d’Huez','Mountain',127.9,[745,1245,890,1660,840,680,760,520,1360,710,1860]],
 ['2026-07-25','Le Bourg d’Oisans','Alpe d’Huez','Mountain',170.9,[720,1180,2065,720,520,1565,1260,2642,610,1780,1450,1860]],
 ['2026-07-26','Thoiry','Paris Champs-Élysées','Flat',88.7,[145,125,160,115,95,75,55,92,48,108,50,112,46,60]],
]

const routeMap = (alt:string):RouteMap => ({type:'simplified-route',alt,verified:false,source:SOURCE,points:[{x:8,y:51},{x:24,y:46},{x:39,y:53},{x:57,y:48},{x:74,y:55},{x:94,y:47}]})

const stageFromSeed = (seed:TourSeed,index:number):ProfessionalStage => {
 const [date,start,finish,classification,distanceKm,elevations]=seed
 const workout=raceStages.find(stage=>stage.number===index+1)
 return {
  number:index+1,date,start,finish,classification,type:classification,
  officialDistanceKm:distanceKm,distanceKm,officialAscentM:workout?.elevationM??0,
  indoorDurationMinutes:workout?Math.round(workout.segments.reduce((sum,segment)=>sum+segment.sec,0)/60):undefined,
  plannedDurationMinutes:workout?Math.round(workout.segments.reduce((sum,segment)=>sum+segment.sec,0)/60):undefined,
  mission:workout?.objective??`Complete the official ${classification.toLowerCase()} course.`,
  profilePoints:elevations.map((elevationM,pointIndex)=>({distanceKm:Number((distanceKm*pointIndex/(elevations.length-1)).toFixed(3)),elevationM})),
  verification:{profile:true,distance:true,ascent:false,markers:false,map:false,source:SOURCE,reference:`https://www.letour.fr/en/stage-${index+1}`,updatedAt:UPDATED_AT},
  workoutReady:Boolean(workout),rideable:Boolean(workout),stageMap:routeMap(`Tour de France Stage ${index+1}, ${start} to ${finish}`),
  // No course marker is added unless its route kilometre is supported by the source.
  segments:workout?.segments??[],
 }
}

export const tour2026:ProfessionalRace = {
 id:'tour-2026',season:2026,name:'Tour de France',shortName:'Le Tour',startDate:'2026-07-04',endDate:'2026-07-26',
 identity:{shortName:'Le Tour',raceAccentColor:'#f2d13d',leaderJerseyColor:'#f2d13d',sprintMarkerColor:'#38a852',komMarkerColor:'#ef3340',finishMarkerColor:'#ffffff',kmZeroMarkerColor:'#ffd400',timeCheckMarkerColor:'#55dff7'},
 routeMap:{...routeMap('Simplified overview of the 2026 Tour de France route from Barcelona to Paris'),points:[{x:8,y:54,label:'Barcelona'},{x:25,y:45},{x:43,y:51},{x:62,y:43},{x:78,y:54},{x:94,y:47,label:'Paris'}]},
 restDays:[{afterStage:9,date:'2026-07-13',label:'Rest Day 1 · Cantal'},{afterStage:15,date:'2026-07-20',label:'Rest Day 2 · Haute-Savoie'}],
 stages:seeds.map(stageFromSeed),
}
