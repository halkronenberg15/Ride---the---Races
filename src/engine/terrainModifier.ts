import type { ResolvedPrescription } from './prescription.ts'
import { FULL_ROAD, PELOTON_MANUAL_PROFILE, resolveVirtualRoadLoad, translateManualRoadFeel, type ManualBikeProfile, type ManualRoadFeelPrescription, type RoadFeelScale } from './manualBike.ts'

export type TerrainType = 'flat' | 'rolling' | 'climb' | 'descent'
export type NumericRange = { min: number; max: number }
export type LivePrescription = ResolvedPrescription & {
  powerRange: NumericRange
  cadenceRange: NumericRange
  resistanceRange: NumericRange
  authoritativeGradient: number
  manualRoadFeel: ManualRoadFeelPrescription
  manualResistanceTarget: number
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
  _terrain: TerrainType,
  ftp: number,
  bikeProfile:ManualBikeProfile=PELOTON_MANUAL_PROFILE,
  roadFeel:RoadFeelScale=FULL_ROAD,
): LivePrescription {
  const gradient = Number.isFinite(currentGradient) ? currentGradient : 0
  const climbPressure = Math.max(0, gradient - 2)
  const authoredCadence = parseRange(prescription.cadence, { min: 80, max: 95 })
  const cadenceDrop = climbPressure * 1.25
  let cadenceRange = {
    min: bounded(authoredCadence.min - cadenceDrop, 65, 125),
    max: bounded(authoredCadence.max - cadenceDrop, 68, 130),
  }
  if(gradient<0)cadenceRange={min:Math.max(cadenceRange.min,gradient<=-4?90:86),max:Math.max(cadenceRange.max,gradient<=-4?105:100)}
  const ceiling = Math.max(0, ftp * prescription.ftpPercent.max / 100)
  const floor = Math.max(0, ftp * prescription.ftpPercent.min / 100)
  const powerRange = { min: Math.min(ceiling, floor + climbPressure * ftp * .004), max: ceiling }
  const roadLoad=resolveVirtualRoadLoad(gradient,roadFeel)
  const manualRoadFeel=translateManualRoadFeel(bikeProfile,roadLoad,(powerRange.min+powerRange.max)/2,(cadenceRange.min+cadenceRange.max)/2)
  const resistanceRange={min:Math.max(bikeProfile.resistanceScaleMin,manualRoadFeel.manualResistanceTarget-2),max:Math.min(bikeProfile.resistanceScaleMax,manualRoadFeel.manualResistanceTarget+2)}
  return {
    ...prescription,
    authoritativeGradient: gradient,
    manualRoadFeel,
    manualResistanceTarget:manualRoadFeel.manualResistanceTarget,
    resistanceRange,
    cadenceRange,
    powerRange,
    resistance: `${manualRoadFeel.manualResistanceTarget}%`,
    cadence: print(cadenceRange, ' rpm'),
    power: print(powerRange, ' W'),
  }
}
