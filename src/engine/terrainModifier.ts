import type { ResolvedPrescription } from './prescription.ts'

export type TerrainType = 'flat' | 'rolling' | 'climb' | 'descent'
export type NumericRange = { min: number; max: number }
export type LivePrescription = ResolvedPrescription & {
  powerRange: NumericRange
  cadenceRange: NumericRange
  resistanceRange: NumericRange
  authoritativeGradient: number
}

const bounded = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const parseRange = (value: string, fallback: NumericRange): NumericRange => {
  const match = value.replace(/[–—]/g, '-').match(/(\d+)\s*(?:-|to)\s*(\d+)/i)
  return match ? { min: Number(match[1]), max: Number(match[2]) } : fallback
}
const print = (value: NumericRange, suffix: string) => `${Math.round(value.min)}–${Math.round(value.max)}${suffix}`

/** Applies road feel after strategy resolution without owning or changing geography. */
export function applyTerrainModifier(
  prescription: ResolvedPrescription,
  currentGradient: number,
  terrain: TerrainType,
  ftp: number,
): LivePrescription {
  const gradient = Number.isFinite(currentGradient) ? currentGradient : 0
  const climbPressure = Math.max(0, gradient - 2)
  const authoredResistance = prescription.resistanceRange
  const authoredCadence = parseRange(prescription.cadence, { min: 80, max: 95 })
  const resistanceLift = climbPressure * 1.7 + (terrain === 'rolling' ? 1 : 0)
  const resistanceRange = {
    min: bounded(authoredResistance.min + resistanceLift, 20, 86),
    max: bounded(authoredResistance.max + resistanceLift, 24, 88),
  }
  resistanceRange.max = Math.max(resistanceRange.min, resistanceRange.max)
  const cadenceDrop = climbPressure * 1.25
  const cadenceRange = {
    min: bounded(authoredCadence.min - cadenceDrop, 65, 125),
    max: bounded(authoredCadence.max - cadenceDrop, 68, 130),
  }
  const ceiling = Math.max(0, ftp * prescription.ftpPercent.max / 100)
  const floor = Math.max(0, ftp * prescription.ftpPercent.min / 100)
  const powerRange = { min: Math.min(ceiling, floor + climbPressure * ftp * .004), max: ceiling }
  return {
    ...prescription,
    authoritativeGradient: gradient,
    resistanceRange,
    cadenceRange,
    powerRange,
    resistance: print(resistanceRange, '%'),
    cadence: print(cadenceRange, ' rpm'),
    power: print(powerRange, ' W'),
  }
}
