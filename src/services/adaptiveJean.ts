import type { RideSegment } from '../data/raceStages'
import type { RaceStrategy } from '../types/tactics'
import type { StageSnapshot } from '../engine/stageEngine'

export type JeanGear = 'calm' | 'focused' | 'urgent'
export type JeanMode = 'neutral' | 'time-trial' | 'climb' | 'sprint' | 'recovery' | 'finish'

const lines: Record<JeanMode, Record<JeanGear, string[]>> = {
  neutral: { calm: ['Okay team, click in.', 'Easy pressure. Let the race come to us.', 'Settle in and listen for the next call.'], focused: ['Hold position as the flag approaches.', 'Stay together for kilometre zero.'], urgent: ['Flag is down. Stay alert.'] },
  'time-trial': { calm: ['Settle onto the extensions.', 'Quiet shoulders.'], focused: ['Hold the line.', 'Stay aero.', 'Keep the pressure through the pedals.', 'You’re gaining time.'], urgent: ['Everything through the finish.', 'Do not let the power fall.'] },
  climb: { calm: ['Settle into it.', 'Stay seated and smooth.', 'Don’t chase the surge.', 'Find your rhythm.', 'Keep turning.'], focused: ['The road steepens ahead. Add two points.', 'Hold the power and let cadence settle.', 'Nearly there. Keep pushing over the top.'], urgent: ['Stay with it.', 'Five seconds. Finish the climb.', 'Through the summit.'] },
  sprint: { calm: ['Stay sheltered for now.', 'Save the jump.'], focused: ['Move up.', 'Hold the wheel.', 'This is it.'], urgent: ['Don’t back off.', 'Everything through the line.', 'Drive all the way.'] },
  recovery: { calm: ['Drink now. Let the breathing settle.', 'Take two points out and spin the legs.', 'Fuel now while the road is quiet.'], focused: ['Stay loose and keep contact.'], urgent: ['Eyes up through the descent.'] },
  finish: { calm: ['Easy gear now. Recovery starts here.'], focused: ['Strong ride. Keep turning.'], urgent: ['Everything through the line.'] },
}

export function jeanMode(segment: RideSegment, snapshot: StageSnapshot): JeanMode {
  const text = `${segment.name} ${segment.type}`.toLowerCase()
  if (snapshot.phase === 'complete') return 'finish'
  if (/neutral/.test(text)) return 'neutral'
  if (/time trial|start ramp/.test(text)) return 'time-trial'
  if (/climb|summit|col |côte|cote|ascent/.test(text)) return 'climb'
  if (/sprint|lead-out|finale/.test(text)) return 'sprint'
  if (/recovery|descent|cooldown|easy/.test(text)) return 'recovery'
  return 'neutral'
}

export function jeanGear(mode: JeanMode, snapshot: StageSnapshot): JeanGear {
  if ((mode === 'climb' && snapshot.segmentRemaining <= 10) || (mode === 'sprint' && snapshot.segmentRemaining <= 30) || mode === 'finish') return 'urgent'
  if (mode === 'time-trial' || mode === 'sprint' || snapshot.segmentProgress >= 0.75) return 'focused'
  return 'calm'
}

export function selectJeanLine(mode: JeanMode, gear: JeanGear, seed: number, recent: string[] = []) {
  const pool = lines[mode][gear]
  const available = pool.filter((line) => !recent.includes(line))
  const choices = available.length ? available : pool
  return choices[Math.abs(seed) % choices.length]
}

export function neutralBriefing(stageNumber: number, route: string, strategy: RaceStrategy, teamObjective: string, mission: string) {
  return [
    'Okay team, click in.',
    `Stage ${stageNumber}. ${route}.`,
    `${strategy} today. ${teamObjective}`,
    mission,
  ]
}
