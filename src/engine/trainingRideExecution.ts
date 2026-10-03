import type { ExecutableWorkoutSection } from './adaptiveTraining40251.ts'
import { jimmyTransitionCue } from './jimmyRadio.ts'

export type RideExecutionOutcome='COMPLETED'|'PARTIAL'
export type RideLegs='FRESH'|'GOOD'|'NOTICEABLE_FATIGUE'|'HEAVY'|'VERY_HEAVY'

export type RideTimelineSection={
 id:string
 title:string
 index:number
 startsAt:number
 endsAt:number
 durationSeconds:number
}

export type RideExecutionSnapshot={
 elapsedSeconds:number
 totalSeconds:number
 progress:number
 current:RideTimelineSection
 next:RideTimelineSection|null
 sectionRemainingSeconds:number
 workoutRemainingSeconds:number
 secondsToNextTransition:number
 completed:boolean
}

export type RideExecutionSummary={
 workoutId:string
 assignmentId?:string
 plannedSeconds:number
 activeSeconds:number
 completionPercentage:number
 outcome:RideExecutionOutcome
 pauseCount:number
 rpe?:number
 legsAfter?:RideLegs
 completedSectionIds:string[]
 endedAt:string
}

export function buildRideTimeline(sections:ExecutableWorkoutSection[]):RideTimelineSection[]{
 let cursor=0
 return sections.map((section,index)=>{
   const item={id:section.id,title:section.title,index,startsAt:cursor,endsAt:cursor+section.durationSeconds,durationSeconds:section.durationSeconds}
   cursor=item.endsAt
   return item
 })
}

export function rideExecutionSnapshot(sections:ExecutableWorkoutSection[],elapsedSeconds:number):RideExecutionSnapshot{
 const timeline=buildRideTimeline(sections)
 if(!timeline.length)throw new Error('Ride requires at least one executable section.')
 const totalSeconds=timeline[timeline.length-1].endsAt
 const elapsed=Math.max(0,Math.min(totalSeconds,Math.floor(elapsedSeconds)))
 const current=timeline.find(item=>elapsed<item.endsAt)??timeline[timeline.length-1]
 const next=timeline[current.index+1]??null
 const completed=elapsed>=totalSeconds
 return {
   elapsedSeconds:elapsed,
   totalSeconds,
   progress:totalSeconds?elapsed/totalSeconds:0,
   current,
   next,
   sectionRemainingSeconds:completed?0:Math.max(0,current.endsAt-elapsed),
   workoutRemainingSeconds:Math.max(0,totalSeconds-elapsed),
   secondsToNextTransition:completed?0:Math.max(0,current.endsAt-elapsed),
   completed,
 }
}

export function completedSectionIds(sections:ExecutableWorkoutSection[],elapsedSeconds:number){
 const timeline=buildRideTimeline(sections)
 return timeline.filter(item=>elapsedSeconds>=item.endsAt).map(item=>item.id)
}

export function buildRideExecutionSummary(args:{
 workoutId:string
 assignmentId?:string
 sections:ExecutableWorkoutSection[]
 activeSeconds:number
 pauseCount:number
 rpe?:number
 legsAfter?:RideLegs
 endedAt?:string
}):RideExecutionSummary{
 const timeline=buildRideTimeline(args.sections)
 const plannedSeconds=timeline.length?timeline[timeline.length-1].endsAt:0
 const activeSeconds=Math.max(0,Math.min(plannedSeconds,Math.floor(args.activeSeconds)))
 const completionPercentage=plannedSeconds?Math.round((activeSeconds/plannedSeconds)*1000)/10:0
 return {
   workoutId:args.workoutId,
   assignmentId:args.assignmentId,
   plannedSeconds,
   activeSeconds,
   completionPercentage,
   outcome:activeSeconds>=plannedSeconds?'COMPLETED':'PARTIAL',
   pauseCount:Math.max(0,Math.floor(args.pauseCount)),
   rpe:args.rpe,
   legsAfter:args.legsAfter,
   completedSectionIds:completedSectionIds(args.sections,activeSeconds),
   endedAt:args.endedAt??new Date().toISOString(),
 }
}

export function transitionCue(secondsRemaining:number,nextTitle?:string,nextZone?:string){
 return jimmyTransitionCue(secondsRemaining,nextTitle,nextZone)
}
