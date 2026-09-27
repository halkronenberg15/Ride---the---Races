import type { RideMetricEntry } from '../types/career.ts'
import type { CalendarAssignment } from './alpha4025.ts'

export type PostRideReport={
 headline:string
 outcome:'ON TARGET'|'CONTROLLED'|'NEEDS REVIEW'
 summary:string
 evidence:string[]
 nextStep:string
}

export function buildPostRideReport(assignment:CalendarAssignment,ride:RideMetricEntry,ftp:number|null):PostRideReport{
 const actual={...ride,...ride.correctedEntry}
 const planned=assignment.durationMinutes
 const durationPct=planned>0?actual.durationMinutes/planned:1
 const evidence:string[]=[]
 let outcome:PostRideReport['outcome']='ON TARGET'
 if(durationPct>=.95)evidence.push(`Duration matched the prescription: ${actual.durationMinutes} of ${planned} min.`)
 else if(durationPct>=.75){outcome='CONTROLLED';evidence.push(`Ride was shortened: ${actual.durationMinutes} of ${planned} planned minutes.`)}
 else {outcome='NEEDS REVIEW';evidence.push(`Ride ended well short of plan: ${actual.durationMinutes} of ${planned} minutes.`)}

 if(actual.averagePower!==undefined){
   if(assignment.powerTarget){
     const {minimum,maximum}=assignment.powerTarget
     if(actual.averagePower>=minimum&&actual.averagePower<=maximum)evidence.push(`Average power ${actual.averagePower} W landed inside the planned ${minimum}–${maximum} W range.`)
     else if(actual.averagePower<minimum){if(outcome==='ON TARGET')outcome='CONTROLLED';evidence.push(`Average power ${actual.averagePower} W was below the planned ${minimum}–${maximum} W range.`)}
     else {if(outcome==='ON TARGET')outcome='CONTROLLED';evidence.push(`Average power ${actual.averagePower} W was above the planned ${minimum}–${maximum} W range.`)}
   } else if(ftp)evidence.push(`Average power was ${actual.averagePower} W, about ${Math.round(actual.averagePower/ftp*100)}% of current FTP.`)
 }
 if(actual.averageHeartRate!==undefined)evidence.push(`Average heart rate: ${actual.averageHeartRate} bpm${actual.maximumHeartRate?`; max ${actual.maximumHeartRate} bpm`:''}.`)
 if(actual.averageCadence!==undefined)evidence.push(`Average cadence: ${Math.round(actual.averageCadence)} rpm.`)
 if(actual.rpe!==undefined)evidence.push(`Recorded RPE: ${actual.rpe}/10.`)
 if(actual.notes)evidence.push(`Rider note: ${actual.notes}`)

 const headline=outcome==='ON TARGET'?'Session executed as planned':outcome==='CONTROLLED'?'Useful work with a pacing or duration flag':'Session needs a closer look'
 const summary=outcome==='ON TARGET'
  ?`This ride delivered the intended ${assignment.purpose.toLowerCase()} stimulus without an obvious execution flag in the recorded metrics.`
  :outcome==='CONTROLLED'
   ?'The ride still contributed useful training, but at least one recorded metric differed from the planned session. RtR keeps the original prescription visible so the difference can inform the next decision.'
   :'The recorded ride differs materially from the planned session. Treat it as evidence, not failure, and use recovery plus the next scheduled session to decide whether the plan needs adjustment.'
 const nextStep=outcome==='ON TARGET'
  ?'Keep the next scheduled session as planned unless readiness says otherwise.'
  :outcome==='CONTROLLED'
   ?'Keep the schedule for now, but review readiness before the next demanding session.'
   :'Prioritize recovery and review readiness before adding or replacing any missed work.'
 return {headline,outcome,summary,evidence,nextStep}
}
