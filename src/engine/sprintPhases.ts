import type { RideSegment } from '../data/raceStages.ts'

export type SprintPhaseName = 'BUILD' | 'POSITION' | 'LAUNCH' | 'SPRINT'
export type SprintPhase = { name: SprintPhaseName; start: number; end: number; zone: string; power: string; cadence: string; resistance: string }
export type SprintSnapshot = SprintPhase & { index: number; progress: number; remaining: number }

const range = (value: string) => value.match(/(\d+)\s*[–-]\s*(\d+)/)?.slice(1).map(Number)
const unit = (value: string) => value.includes('rpm') ? ' rpm' : value.includes('%') ? '%' : ' W'
const phaseRange = (source: string, factor: [number, number]) => {
  const parsed = range(source)
  if (!parsed) return source
  return `${Math.round(parsed[0] * factor[0])}–${Math.round(parsed[1] * factor[1])}${unit(source)}`
}

export function isSprintSection(segment: Pick<RideSegment, 'name' | 'type'>) {
  return /sprint|lead-out/i.test(`${segment.name} ${segment.type}`)
}

/** Proportional phases live on the stage clock; no secondary timer can drift. */
export function buildSprintPhases(segment: RideSegment): SprintPhase[] {
  if (!isSprintSection(segment)) return []
  const finish = /finish|finale/i.test(`${segment.name} ${segment.type}`)
  const weights = finish ? [.33, .27, .14, .26] : [.33, .29, .21, .17]
  const names: SprintPhaseName[] = ['BUILD', 'POSITION', 'LAUNCH', 'SPRINT']
  const powerFactors: [number, number][] = finish ? [[.58,.68],[.7,.8],[.82,.92],[1,1]] : [[.55,.65],[.68,.78],[.82,.92],[1,1]]
  const cadenceFactors: [number, number][] = [[.86,.9],[.91,.94],[.95,.98],[1,1]]
  const resistanceFactors: [number, number][] = [[.72,.78],[.8,.86],[.9,.94],[1,1]]
  let start = 0
  return names.map((name, index) => {
    const end = index === names.length - 1 ? segment.sec : start + segment.sec * weights[index]
    const phase = { name, start, end, zone: index === 0 ? 'Z3' : index === 1 ? 'Z3–Z4' : index === 2 ? 'Z5' : finish ? 'Z6' : 'Z5–Z6', power: phaseRange(segment.power, powerFactors[index]), cadence: phaseRange(segment.cadence, cadenceFactors[index]), resistance: phaseRange(segment.resistance, resistanceFactors[index]) }
    start = end
    return phase
  })
}

export function sprintSnapshot(phases: SprintPhase[], elapsedInSegment: number): SprintSnapshot | null {
  if (!phases.length) return null
  const elapsed = Math.max(0, elapsedInSegment)
  const index = Math.min(phases.length - 1, Math.max(0, phases.findIndex((phase) => elapsed < phase.end)))
  const phase = phases[index]
  return { ...phase, index, progress: Math.min(1, Math.max(0, (elapsed - phase.start) / (phase.end - phase.start))), remaining: Math.max(0, phase.end - elapsed) }
}
