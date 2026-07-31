export let currentStageIndex = 0

export function getCurrentStageIndex() {
  return currentStageIndex
}

export function getCurrentStage() {
  return currentStageIndex
}

export function advanceToNextStage() {
  currentStageIndex += 1
}

export function resetTour() {
  currentStageIndex = 0
}