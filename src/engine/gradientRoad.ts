import type { RideSegment } from '../data/raceStages'

export type GradientSection = { gradient: number; start: number; end: number }

export function gradientSectionIndex(sections: GradientSection[], progress: number) {
  if (!sections.length) return 0
  const normalized = Math.min(1, Math.max(0, progress))
  const index = sections.findIndex((section) => normalized >= section.start && normalized < section.end)
  return index < 0 ? sections.length - 1 : index
}

export function gradientDifficultyColor(gradient: number) {
  if (gradient < 3) return '#29a35a'
  if (gradient < 6) return '#2374d8'
  if (gradient < 9) return '#d73535'
  return '#111111'
}

export function buildGradientSections(seedText: string, durationSeconds: number, zone: string): GradientSection[] {
  let seed = [...seedText].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0)
  const count = Math.max(5, Math.min(10, Math.round(durationSeconds / 90)))
  const zoneNumber = Number(zone.match(/Z(\d)/i)?.[1] ?? 3)
  const base = zoneNumber >= 5 ? 8.6 : zoneNumber === 4 ? 7.4 : zoneNumber === 3 ? 6.2 : 5.2
  return Array.from({ length: count }, (_, index) => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const gradient = Math.max(2.8, Math.min(13.5, base + (seed / 4294967296 - 0.5) * 3.2 + Math.sin(index / Math.max(1, count - 1) * Math.PI * 2) * 1.15 + (index >= count - 2 ? .9 : 0)))
    return { gradient: Number(gradient.toFixed(1)), start: index / count, end: (index + 1) / count }
  })
}

function range(value: string) {
  const match = value.replace(/[–—]/g, '-').match(/(\d+)\s*-\s*(\d+)/)
  return match ? { min: Number(match[1]), max: Number(match[2]) } : null
}

/** Maps road pitch into a narrow target without ever leaving the segment envelope. */
export function gradientResistance(segment: Pick<RideSegment, 'resistance'>, sections: GradientSection[], activeIndex: number) {
  const envelope = range(segment.resistance)
  if (!envelope || sections.length === 0) return segment.resistance
  const gradients = sections.map((section) => section.gradient)
  const low = Math.min(...gradients)
  const high = Math.max(...gradients)
  const normalized = high === low ? .5 : (gradients[activeIndex] - low) / (high - low)
  const center = envelope.min + normalized * (envelope.max - envelope.min)
  const min = Math.max(envelope.min, Math.min(envelope.max - 2, Math.round(center - 1)))
  return `${min}–${Math.min(envelope.max, min + 2)}%`
}
