import type { RideSegment } from '../data/raceStages'
import type { RaceStrategy } from '../types/tactics'

const BASELINE_FTP = 206

type NumberRange = { min: number; max: number; prefix?: string; suffix: string }

export type StrategyProfile = {
  strategy: RaceStrategy
  powerMultiplier: number
  resistanceDelta: number
  recoveryMultiplier: number
  label: string
  description: string
  tradeoff: string
}

export const strategyProfiles: Record<RaceStrategy, StrategyProfile> = {
  Conservative: {
    strategy: 'Conservative',
    powerMultiplier: 0.93,
    resistanceDelta: -3,
    recoveryMultiplier: 1.08,
    label: 'Protect the legs',
    description: 'Lower power and resistance with slightly longer recovery emphasis.',
    tradeoff: 'Safer execution, but fewer chances to gain time.',
  },
  Balanced: {
    strategy: 'Balanced',
    powerMultiplier: 1,
    resistanceDelta: 0,
    recoveryMultiplier: 1,
    label: 'Follow team plan',
    description: 'Ride the stage exactly as Jean designed it for your current FTP.',
    tradeoff: 'The most dependable blend of risk and reward.',
  },
  Aggressive: {
    strategy: 'Aggressive',
    powerMultiplier: 1.07,
    resistanceDelta: 3,
    recoveryMultiplier: 0.92,
    label: 'Pressure the race',
    description: 'Higher power and resistance with less forgiving recovery.',
    tradeoff: 'More opportunity, more fatigue, and a greater chance of cracking.',
  },
}

function parseRange(value: string, suffix: string): NumberRange | null {
  const normalized = value.replace(/[–—]/g, '-')
  const range = normalized.match(/(\d+)\s*-\s*(\d+)/)
  if (range) return { min: Number(range[1]), max: Number(range[2]), suffix }

  const under = normalized.match(/Under\s+(\d+)/i)
  if (under) return { min: 0, max: Number(under[1]), prefix: 'Under ', suffix }

  return null
}

function formatRange(range: NumberRange, minimum: number, maximum: number) {
  const min = Math.max(minimum, Math.min(maximum, Math.round(range.min)))
  const max = Math.max(minimum, Math.min(maximum, Math.round(range.max)))
  if (range.prefix) return `${range.prefix}${max}${range.suffix}`
  return `${min}–${Math.max(min, max)}${range.suffix}`
}

function isRecovery(segment: RideSegment) {
  const text = `${segment.type} ${segment.zone} ${segment.name}`.toLowerCase()
  return text.includes('recovery') || text.includes('descent') || text.includes('cooldown') || text.includes('easy')
}

export function adaptSegment(
  segment: RideSegment,
  ftp: number,
  strategy: RaceStrategy,
): RideSegment {
  const profile = strategyProfiles[strategy]
  const riderScale = Math.max(0.45, Math.min(2.5, ftp / BASELINE_FTP))
  const recovery = isRecovery(segment)
  const powerStrategy = recovery
    ? 1 + (profile.powerMultiplier - 1) * 0.35
    : profile.powerMultiplier

  const powerRange = parseRange(segment.power, ' W')
  const resistanceRange = parseRange(segment.resistance, '%')

  const power = powerRange
    ? formatRange({
        ...powerRange,
        min: powerRange.min * riderScale * powerStrategy,
        max: powerRange.max * riderScale * powerStrategy,
      }, 0, 1200)
    : segment.power

  const resistanceDelta = recovery
    ? Math.round(profile.resistanceDelta * 0.5)
    : profile.resistanceDelta
  const resistance = resistanceRange
    ? formatRange({
        ...resistanceRange,
        min: resistanceRange.min + resistanceDelta,
        max: resistanceRange.max + resistanceDelta,
      }, 15, 100)
    : segment.resistance

  return {
    ...segment,
    power,
    resistance,
    sec: recovery ? Math.max(30, Math.round(segment.sec * profile.recoveryMultiplier)) : segment.sec,
  }
}

export function adaptSegments(
  segments: RideSegment[],
  ftp: number,
  strategy: RaceStrategy,
) {
  return segments.map((segment) => adaptSegment(segment, ftp, strategy))
}
