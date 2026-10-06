import type { RiderPerformance } from './telemetry.ts'
import { createJeanEvent, type JeanEvent } from './jeanEvents.ts'

export type DirectorPerformanceContext={
 eventScope:string
 performance:RiderPerformance
 currentTargetLabel:string
 nextTargetLabel?:string
}

/**
 * Performance-aware coaching projection.
 * It can produce coaching language but cannot mutate tactics or geography.
 */
export function directorPerformanceEvent(context:DirectorPerformanceContext):JeanEvent|null{
 const {performance}=context
 if(performance.stale||performance.targetCompliance===null)return null

 if(performance.targetCompliance>=.92&&performance.fatigue<75){
  return createJeanEvent(
   `performance-strong-${context.eventScope}`,
   'performance',
   `Good. You are right on the target. Hold ${context.currentTargetLabel} and stay patient.`,
   35,
  )
 }

 if(performance.targetCompliance<.55){
  return createJeanEvent(
   `performance-low-${context.eventScope}`,
   'performance',
   `Ease back into the prescribed target: ${context.currentTargetLabel}. Do not chase the race by forcing the bike.`,
   70,
  )
 }

 if(performance.fatigue>=90){
  return createJeanEvent(
   `performance-fatigue-${context.eventScope}`,
   'performance',
   `Fatigue is high. Protect the current target and be ready for ${context.nextTargetLabel??'the next section'}.`,
   80,
  )
 }

 return null
}
