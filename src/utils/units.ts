import type { MeasurementSystem } from '../types/career'

const KM_TO_MI = 0.621371
const M_TO_FT = 3.28084
const KG_TO_LB = 2.20462
const CM_TO_IN = 0.393701

export function kmToMi(value: number) { return value * KM_TO_MI }
export function miToKm(value: number) { return value / KM_TO_MI }
export function mToFt(value: number) { return value * M_TO_FT }
export function ftToM(value: number) { return value / M_TO_FT }
export function kgToLb(value: number) { return value * KG_TO_LB }
export function lbToKg(value: number) { return value / KG_TO_LB }
export function cmToIn(value: number) { return value * CM_TO_IN }
export function inToCm(value: number) { return value / CM_TO_IN }

export function formatDistance(km: number, system: MeasurementSystem, digits = 1) {
  return system === 'imperial' ? `${kmToMi(km).toFixed(digits)} mi` : `${km.toFixed(digits)} km`
}

export function formatElevation(meters: number, system: MeasurementSystem) {
  return system === 'imperial'
    ? `${Math.round(mToFt(meters)).toLocaleString()} ft`
    : `${Math.round(meters).toLocaleString()} m`
}

export function formatWeight(kg: number, system: MeasurementSystem) {
  return system === 'imperial' ? `${kgToLb(kg).toFixed(1)} lb` : `${kg.toFixed(1)} kg`
}

export function formatHeight(cm: number, system: MeasurementSystem) {
  if (system === 'metric') return `${Math.round(cm)} cm`
  const totalInches = Math.round(cmToIn(cm))
  return `${Math.floor(totalInches / 12)} ft ${totalInches % 12} in`
}
