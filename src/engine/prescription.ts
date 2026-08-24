import type { RideSegment } from '../data/raceStages.ts'

export type Prescription = Pick<RideSegment, 'zone' | 'power' | 'cadence' | 'resistance'> & {
  ftpPercent: { min: number; max: number }
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

function numericRange(value: string) {
  const match = value.replace(/[–—]/g, '-').match(/(\d+)\s*(?:-|to)\s*(\d+)/i)
  return match ? { min: Number(match[1]), max: Number(match[2]) } : null
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
