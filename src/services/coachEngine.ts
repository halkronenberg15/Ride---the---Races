import type { CareerState, ExperienceLevel, RiderArchetype } from '../types/career'
import type { RaceStage } from '../data/raceStages'

export type DayPhase = 'morning' | 'afternoon' | 'evening' | 'night'
export type TrainingLoad = 'Recovery' | 'Controlled' | 'Productive' | 'Race Day'

export type CoachBriefing = {
  phase: DayPhase
  greeting: string
  readiness: number
  readinessLabel: string
  briefing: string
  dailyGoal: string
  recoveryAdvice: string
  motivation: string
  trainingLoad: TrainingLoad
  targetEffort: string
  tacticalCue: string
}

const motivations = {
  high: [
    'The legs are ready. Keep the head patient.',
    'Form creates the opportunity. Timing finishes the job.',
    'Today you can race forward, not merely survive.',
  ],
  medium: [
    'Discipline keeps matches in the box for later.',
    'Ride the plan until the race gives you a better one.',
    'Smooth power now creates options later.',
  ],
  low: [
    'Recovery is training with the volume turned down.',
    'The smart rider protects tomorrow without wasting today.',
    'Control is not weakness. It is race intelligence.',
  ],
}

const experienceMultiplier: Record<ExperienceLevel, number> = {
  Beginner: 0.82,
  Recreational: 0.9,
  Intermediate: 1,
  Advanced: 1.06,
  Competitive: 1.1,
}

function getDayPhase(hour = new Date().getHours()): DayPhase {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  if (hour < 22) return 'evening'
  return 'night'
}

function getGreeting(phase: DayPhase) {
  if (phase === 'morning') return 'Good morning'
  if (phase === 'afternoon') return 'Good afternoon'
  if (phase === 'evening') return 'Good evening'
  return 'Late night check-in'
}

function getReadiness(career: CareerState) {
  const sleepScore = Math.min(100, Math.max(0, (career.health.sleepHours / 8) * 100))
  return Math.round(
    career.health.recoveryScore * 0.5 +
    (100 - career.health.fatigue) * 0.3 +
    sleepScore * 0.2,
  )
}

function seededPick<T>(items: T[], stageNumber: number): T {
  const today = new Date()
  const seed = today.getFullYear() * 1000 + today.getMonth() * 50 + today.getDate() + stageNumber
  return items[seed % items.length]
}

function archetypeCue(archetype: RiderArchetype, stage: RaceStage): string {
  const terrain = stage.theme.toLowerCase()
  if (archetype === 'Sprinter') return terrain.includes('flat') ? 'Stay protected until the final launch.' : 'Survive the climbs and preserve your finish.'
  if (archetype === 'Climber') return 'Settle into rhythm early and make the gradient work for you.'
  if (archetype === 'GC Contender') return 'Mark the dangerous moves and avoid losing time through poor positioning.'
  if (archetype === 'Domestique') return 'Keep the leader sheltered and close every dangerous gap.'
  if (archetype === 'Time Trial Specialist') return 'Hold aerodynamic discipline and build pressure steadily.'
  if (archetype === 'Puncheur') return 'Save one sharp acceleration for the decisive rise.'
  return 'Stay adaptable and respond to the race, not the noise.'
}

function targetEffort(career: CareerState, readiness: number): string {
  const multiplier = experienceMultiplier[career.rider.experience]
  const readinessFactor = readiness >= 85 ? 0.92 : readiness >= 65 ? 0.82 : 0.68
  const target = Math.round(career.rider.ftp * multiplier * readinessFactor)
  const range = Math.max(8, Math.round(target * 0.05))
  return `${target - range}-${target + range} W sustained target`
}

export function createCoachBriefing(career: CareerState, stage: RaceStage): CoachBriefing {
  const phase = getDayPhase()
  const greeting = getGreeting(phase)
  const readiness = getReadiness(career)
  const firstName = career.rider.name.split(' ')[0]
  const cue = archetypeCue(career.rider.archetype, stage)

  let readinessLabel = 'Protect the legs'
  let trainingLoad: TrainingLoad = 'Recovery'
  let briefing = `${firstName}, recovery is limited today. Stay sheltered, keep every effort controlled, and race only when it matters. ${cue}`
  let recoveryAdvice = 'Keep the warm-up gentle, hydrate early, and prioritize sleep after the ride.'

  if (readiness >= 85) {
    readinessLabel = 'Ready to race'
    trainingLoad = 'Race Day'
    briefing = `${firstName}, the numbers are strong and the legs should answer. Stay patient early, then commit when the race opens. ${cue}`
    recoveryAdvice = 'Fuel before the hard work and begin recovery within thirty minutes of finishing.'
  } else if (readiness >= 65) {
    readinessLabel = 'Race with discipline'
    trainingLoad = 'Productive'
    briefing = `${firstName}, you are ready, but spend your energy carefully. Avoid empty surges and commit only to decisive moments. ${cue}`
    recoveryAdvice = 'Keep the effort controlled and replenish fluids and carbohydrates after the ride.'
  } else if (readiness >= 45) {
    readinessLabel = 'Controlled day'
    trainingLoad = 'Controlled'
  }

  if (phase === 'night') {
    trainingLoad = 'Recovery'
    briefing = `${firstName}, tomorrow's performance starts tonight. Review the plan, prepare your kit, and get off the wheel of the day.`
    recoveryAdvice = 'Dim the screens, hydrate lightly, and make sleep the final training block of the day.'
  }

  const motivationPool = readiness >= 85 ? motivations.high : readiness >= 65 ? motivations.medium : motivations.low

  return {
    phase,
    greeting,
    readiness,
    readinessLabel,
    briefing,
    dailyGoal: stage.teamOrders[0] ?? stage.objective,
    recoveryAdvice,
    motivation: seededPick(motivationPool, stage.number),
    trainingLoad,
    targetEffort: targetEffort(career, readiness),
    tacticalCue: cue,
  }
}
