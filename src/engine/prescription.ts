import type { RideSegment } from '../data/raceStages.ts'

export type Prescription = Pick<RideSegment, 'zone' | 'power' | 'cadence' | 'resistance'> & {
  ftpPercent: { min: number; max: number }
}

export type ResolvedPrescription = Prescription & {
  prescriptionId: string
  segmentId: string
  intervalId: string
  strategy: string
  resistanceRange: { min: number; max: number }
  cadenceRange: { min: number; max: number }
  powerRange: { min: number; max: number } | null
}

export type PrescriptionState = {
  currentPrescription: ResolvedPrescription
  nextPrescription: ResolvedPrescription | null
  timeUntilNextPrescription: number | null
  nextPrescriptionDuration: number | null
  currentRemaining: number
}

const FTP_ZONES = [
  { max: 55, label: 'Z1' }, { max: 75, label: 'Z2' }, { max: 90, label: 'Z3' },
  { max: 105, label: 'Z4' }, { max: 120, label: 'Z5' }, { max: Infinity, label: 'Z6' },
]

const zoneAt = (percent: number) => FTP_ZONES.find(zone => percent <= zone.max)!.label

export function zoneForFtpRange(min: number, max: number) {
  const low = zoneAt(min)
  const high = zoneAt(max)
  return low === high ? low : `${low}–${high}`
}

export function numericRange(value: string) {
  const match = value.replace(/[–—]/g, '-').match(/(\d+)\s*(?:-|to)\s*(\d+)/i)
  return match ? { min: Number(match[1]), max: Number(match[2]) } : null
}

/** Canonical workout target resolver. Geography is deliberately not an input. */
export function resolvePrescriptionAtState(
  segments: RideSegment[], segmentStarts: number[], elapsedSeconds: number, strategy = 'Balanced',
): PrescriptionState {
  const duration = segments.reduce((sum, segment) => sum + segment.sec, 0)
  const elapsed = Math.max(0, Math.min(duration, elapsedSeconds))
  let index = segments.findIndex((segment, item) => elapsed < segmentStarts[item] + segment.sec)
  if (index < 0) index = segments.length - 1
  const resolve = (segment: RideSegment, item: number): ResolvedPrescription => {
    const range = numericRange(segment.resistance) ?? { min: 0, max: 0 }
    const segmentId = `${item}-${segment.name}`
    return {
      prescriptionId: `${segmentId}-${strategy}`,
      segmentId,
      intervalId: segmentId,
      strategy,
      zone: segment.zone,
      power: segment.power,
      cadence: segment.cadence,
      resistance: segment.resistance,
      resistanceRange: range,
      cadenceRange: numericRange(segment.cadence) ?? { min: 80, max: 95 },
      powerRange: numericRange(segment.power),
      ftpPercent: ftpIntensity(segment) ?? { min: 0, max: 0 },
    }
  }
  const next = segments[index + 1]
  return {
    currentPrescription: resolve(segments[index], index),
    nextPrescription: next ? resolve(next, index + 1) : null,
    timeUntilNextPrescription: next ? Math.max(0, segmentStarts[index] + segments[index].sec - elapsed) : null,
    nextPrescriptionDuration: next?.sec ?? null,
    currentRemaining: Math.max(0, segmentStarts[index] + segments[index].sec - elapsed),
  }
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const formattedRange = (range: { min: number; max: number }, suffix: string) => `${Math.round(range.min)}–${Math.round(range.max)}${suffix}`

/**
 * Applies road pressure after the authored/strategy prescription has resolved.
 * Gradient changes guidance inside the existing intent; it never changes road state.
 */
export function applyTerrainModifier(
  base: ResolvedPrescription,
  currentGradient: number,
  segment: Pick<RideSegment, 'name' | 'type'>,
  riderFtp: number,
): ResolvedPrescription {
  if (!/climb|mountain|summit|steep|ascent|col /i.test(`${segment.name} ${segment.type}`)) return base

  // A continuous ramp beginning at 2% avoids noisy changes on false-flat road.
  const pressure = clamp((Math.max(0, currentGradient) - 2) / 10, 0, 1)
  const resistanceShift = pressure * 9
  const resistanceRange = {
    min: clamp(base.resistanceRange.min + resistanceShift, 20, 82),
    max: clamp(base.resistanceRange.max + resistanceShift, 24, 88),
  }
  const cadenceDrop = pressure * 8
  const cadenceRange = {
    min: clamp(base.cadenceRange.min - cadenceDrop, 65, 110),
    max: clamp(base.cadenceRange.max - cadenceDrop * .75, 75, 120),
  }

  // Bias toward the top of the authored watts range, never beyond it.
  const authoredPower = base.powerRange
  const powerRange = authoredPower ? {
    min: Math.min(authoredPower.max, authoredPower.min + (authoredPower.max - authoredPower.min) * pressure * .2),
    max: authoredPower.max,
  } : null
  const ftpCeiling = riderFtp * base.ftpPercent.max / 100
  if (powerRange && Number.isFinite(ftpCeiling)) powerRange.max = Math.min(powerRange.max, ftpCeiling + 1)

  return {
    ...base,
    resistanceRange,
    cadenceRange,
    powerRange,
    resistance: formattedRange(resistanceRange, '%'),
    cadence: formattedRange(cadenceRange, ' rpm'),
    power: powerRange ? formattedRange(powerRange, ' W') : base.power,
  }
}

/** Resolve the authored intensity once; every displayed target then follows it. */
export function ftpIntensity(segment: RideSegment) {
  const percent = numericRange(segment.power.match(/[^•]*%\s*FTP/i)?.[0] ?? '')
  if (percent) return percent
  const underPercent = segment.power.match(/(?:under|easy to)\s*(\d+)%\s*FTP/i)
  if (underPercent) return { min: 45, max: Number(underPercent[1]) }
  const fromPercent = segment.power.match(/(?:from|to)\s*(\d+)%\s*FTP/i)
  if (fromPercent) return { min: Number(fromPercent[1]), max: Math.max(120, Number(fromPercent[1])) }
  const watts = numericRange(segment.power)
  if (watts) return { min: watts.min / 206 * 100, max: watts.max / 206 * 100 }
  const underWatts = segment.power.match(/Under\s+(\d+)\s*W/i)
  if (underWatts) return { min: 45, max: Number(underWatts[1]) / 206 * 100 }
  return null
}

function cadenceRange(cadence: string) {
  return numericRange(cadence) ?? { min: 80, max: 95 }
}

/**
 * Peloton resistance is guidance, not a second intensity definition. The range
 * is deterministically centred on FTP intensity and adjusted for the authored
 * cadence: slower cadence needs more flywheel resistance for comparable power.
 */
export function createPrescription(segment: RideSegment, ftp: number, intensity: { min: number; max: number }): Prescription {
  const min = Math.max(30, intensity.min)
  const max = Math.max(min, intensity.max)
  const cadence = cadenceRange(segment.cadence)
  const cadenceCenter = (cadence.min + cadence.max) / 2
  const resistanceCenter = 18 + ((min + max) / 2) * .34 + (90 - cadenceCenter) * .22
  const resistanceMin = Math.max(20, Math.min(80, Math.round(resistanceCenter - 5)))
  const resistanceMax = Math.max(resistanceMin + 4, Math.min(85, Math.round(resistanceCenter + 5)))
  return {
    ftpPercent: { min, max },
    zone: zoneForFtpRange(min, max),
    power: `${Math.round(ftp * min / 100)}–${Math.round(ftp * max / 100)} W`,
    cadence: segment.cadence,
    resistance: `${resistanceMin}–${resistanceMax}%`,
  }
}
