import type { CareerState, RideMetricEntry } from '../types/career.ts'

export type MissionPillar = {
  id:'CLIMBING'|'ENDURANCE'|'DURABILITY'|'OUTDOOR'|'FUELING'|'RECOVERY'
  label:string
  state:'EVIDENCE BUILDING'|'NEEDS DEVELOPMENT'|'NEEDS DATA'|'ON TRACK'
  evidence:string
}

const localDay=(value:string)=>value.slice(0,10)
const dayNumber=(value:string)=>Math.floor(new Date(localDay(value)+'T12:00:00Z').getTime()/86400000)

function consecutiveRideDays(rides:RideMetricEntry[]){
 const days=Array.from(new Set(rides.map(ride=>dayNumber(ride.date)))).sort((a,b)=>a-b)
 let best=0,current=0,last:number|null=null
 for(const day of days){
  current=last!==null&&day===last+1?current+1:1
  best=Math.max(best,current)
  last=day
 }
 return best
}

export function missionFranceSnapshot(career:CareerState,now=new Date()){
 const cutoff7=now.getTime()-7*86400000
 const cutoff28=now.getTime()-28*86400000
 const rides7=career.rideHistory.filter(ride=>new Date(ride.date).getTime()>=cutoff7)
 const rides28=career.rideHistory.filter(ride=>new Date(ride.date).getTime()>=cutoff28)
 const minutes7=rides7.reduce((sum,ride)=>sum+ride.durationMinutes,0)
 const minutes28=rides28.reduce((sum,ride)=>sum+ride.durationMinutes,0)
 const distance7Km=rides7.reduce((sum,ride)=>sum+ride.distanceKm,0)
 const longestMinutes=Math.max(0,...career.rideHistory.map(ride=>ride.durationMinutes))
 const backToBack=consecutiveRideDays(career.rideHistory)
 const outdoorCount=career.alpha4025.outdoorActivities.length
 const climbEvidence=career.rideHistory.filter(ride=>/climb|tourmalet|alpe|mountain|summit|gavarnie/i.test((ride.stageName??'')+' '+(ride.notes??''))).length
 const recoveryFresh=Date.now()-new Date(career.health.date+'T12:00:00').getTime()<2*86400000
 const nutritionEntries=career.nutrition.entries.length
 const rideFuelEntries=career.nutrition.entries.filter(entry=>entry.mealType==='Ride Fuel'||entry.mealType==='Recovery').length
 const pillars:MissionPillar[]=[
  {id:'CLIMBING',label:'Sustained climbing',state:climbEvidence>=3?'EVIDENCE BUILDING':'NEEDS DEVELOPMENT',evidence:climbEvidence?climbEvidence+' climbing-related rides recorded':'No climbing-specific ride evidence recorded yet'},
  {id:'ENDURANCE',label:'Long-ride durability',state:longestMinutes>=180?'EVIDENCE BUILDING':'NEEDS DEVELOPMENT',evidence:longestMinutes?'Longest recorded ride: '+longestMinutes+' min':'No completed ride history yet'},
  {id:'DURABILITY',label:'Consecutive-day tolerance',state:backToBack>=3?'EVIDENCE BUILDING':'NEEDS DEVELOPMENT',evidence:backToBack?'Best recorded riding streak: '+backToBack+' consecutive days':'No consecutive-day riding evidence yet'},
  {id:'OUTDOOR',label:'Outdoor mountain skill',state:outdoorCount>=4?'EVIDENCE BUILDING':outdoorCount?'NEEDS DEVELOPMENT':'NEEDS DATA',evidence:outdoorCount?outdoorCount+' outdoor activities recorded':'No outdoor activity evidence recorded yet'},
  {id:'FUELING',label:'Fueling execution',state:rideFuelEntries>=3?'EVIDENCE BUILDING':nutritionEntries?'NEEDS DEVELOPMENT':'NEEDS DATA',evidence:rideFuelEntries?rideFuelEntries+' ride-fueling/recovery entries recorded':nutritionEntries?nutritionEntries+' nutrition entries recorded; add ride-fueling entries to build evidence':'No nutrition or ride-fueling evidence recorded yet'},
  {id:'RECOVERY',label:'Recovery consistency',state:recoveryFresh?'ON TRACK':'NEEDS DATA',evidence:recoveryFresh?'Latest health check-in: '+career.health.date:'Daily recovery check-in needs updating'},
 ]
 return {ftp:career.rider.ftp,weightKg:career.rider.weightKg,minutes7,minutes28,distance7Km,rides7:rides7.length,rides28:rides28.length,longestMinutes,backToBack,outdoorCount,health:career.health,pillars}
}
