import type { RideSegment } from '../data/raceStages'

export type JeanMode = 'neutral' | 'time-trial' | 'climb' | 'sprint' | 'recovery' | 'finish'

export function jeanMode(segment: Pick<RideSegment, 'name' | 'type'>, complete = false): JeanMode {
  const text = `${segment.name} ${segment.type}`
  if (complete) return 'finish'
  if (/neutral|ceremonial/i.test(text)) return 'neutral'
  if (/time trial/i.test(text)) return 'time-trial'
  if (/climb|mountain|summit|col |côte|cote|alpe|pyren|ascent/i.test(text)) return 'climb'
  if (/sprint|lead-out|finale/i.test(text)) return 'sprint'
  if (/cooldown|cool down|recovery|descent|easy/i.test(text)) return 'recovery'
  return 'neutral'
}

const lines: Record<JeanMode, string[]> = {
  neutral: ['Easy shoulders. Let the legs wake up.', 'Hold the wheel; we race after the flag.', 'Calm breathing. Save every match.'],
  'time-trial': ['Lock onto the pace. Every second matters.', 'Stay compact and keep pressure through the pedals.', 'Push the speed, but keep the effort clean.'],
  climb: ['Find the rhythm and ride through the gradient.', 'Quiet upper body. Make the gear work for you.', 'Hold the line; the summit is coming back to us.'],
  sprint: ['Protect the wheel. Your launch is coming.', 'Cadence up. Stay sharp and hold your lane.', 'Now commit—drive all the way through the line!'],
  recovery: ['Gear down. Drink, breathe, and reset.', 'Let the heart rate settle; no wasted pressure.', 'Good. Economical now, we will need the legs later.'],
  finish: ['Stage complete. Excellent work—bring it home easy.', 'Across the line. That was disciplined racing.'],
}

export function jeanCue(mode: JeanMode, event: string | undefined, recent: string[] = [], seed = 0) {
  if (event === 'final-30' && mode === 'sprint') return 'Thirty seconds! Move up, cadence rising—prepare to launch!'
  if (event === 'final-10' && mode === 'sprint') return 'Ten seconds! Go now—everything through the line!'
  if (event === 'final-10' && mode === 'climb') return 'Ten seconds to the summit! Stand if you need it—drive over the top!'
  const choices = lines[mode].filter((line) => !recent.includes(line))
  const pool = choices.length ? choices : lines[mode]
  return pool[Math.abs(seed) % pool.length]
}
