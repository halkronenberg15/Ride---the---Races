export type RaceProgress = { currentStage:number; completedStages:number[] }

/** Resolve the next rideable stage without changing persisted race progress. */
export function actionableStage(progress:RaceProgress, rideableStages:number[]){
  const available=[...rideableStages].sort((a,b)=>a-b)
  return available.find(stage=>stage>=progress.currentStage&&!progress.completedStages.includes(stage))
    ?? available.find(stage=>!progress.completedStages.includes(stage))
    ?? available.at(-1)
    ?? 1
}

export const forwardScrollDestination=(destination:'roadbook'|'briefing'|'cockpit')=>destination==='roadbook'?'actionable-stage':'top'
