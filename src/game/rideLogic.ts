import type { RaceStrategy } from '../types/tactics'

export function calculateProgress(seconds: number) {
  return Math.min(seconds * 2, 100)
}

export function calculateEnergy(
  seconds: number,
  strategy: RaceStrategy,
) {
  let energyDrain = 1

  if (strategy === 'Conservative') {
    energyDrain = 0.7
  }

  if (strategy === 'Aggressive') {
    energyDrain = 1.4
  }

  return Math.max(
    Math.round(100 - seconds * energyDrain),
    0,
  )
}

export function getRadioMessage(
  progress: number,
  strategy: RaceStrategy,
) {
  if (progress >= 80) {
    if (strategy === 'Aggressive') {
      return 'This is your moment. Attack and empty the tank!'
    }

    if (strategy === 'Conservative') {
      return 'You saved energy well. Begin moving forward now.'
    }

    return 'Final kilometers. Stay sharp and prepare to attack.'
  }

  if (progress >= 60) {
    if (strategy === 'Aggressive') {
      return 'The pace is high. Watch your energy.'
    }

    return 'The pace is increasing. Stay alert.'
  }

  if (progress >= 40) {
    return 'Good work. Hold your position.'
  }

  if (progress >= 20) {
    return 'Wind is picking up. Stay protected.'
  }

  if (strategy === 'Aggressive') {
    return 'Ride near the front and pressure the peloton.'
  }

  if (strategy === 'Conservative') {
    return 'Stay sheltered and conserve energy.'
  }

  return 'Stay calm. Settle into the bunch.'
}