import type { RideSegment } from '../data/raceStages'

export type JeanMode = 'neutral' | 'flat' | 'tempo' | 'time-trial' | 'climb' | 'sprint' | 'recovery' | 'finish'
export type DialogueType = 'instruction' | 'observation' | 'warning' | 'tactical' | 'encouragement' | 'race-flavor' | 'transition' | 'recovery'
export type JeanContext = { mode: JeanMode; afterKmZero: boolean; running: boolean; sprintPhase?: string; critical?: boolean }
export type JeanGeographicContext = {
  activeClimbId: string | null
  climbProgress: number
  distanceToSummit: number
  currentGradient: number | null
  courseDistance: number
  remainingOfficialTime: number
  segment: Pick<RideSegment, 'name' | 'type'>
}
export type JeanLine = { text: string; type: DialogueType; topic: string; preKmZeroOnly?: boolean; phase?: string }

export function jeanMode(segment: Pick<RideSegment, 'name' | 'type'>, complete = false): JeanMode {
  const text = `${segment.name} ${segment.type}`
  if (complete) return 'finish'
  if (/neutral|ceremonial/i.test(text)) return 'neutral'
  if (/time trial/i.test(text)) return 'time-trial'
  if (/climb|mountain|summit|col |côte|cote|alpe|pyren|ascent/i.test(text)) return 'climb'
  if (/sprint|lead-out|finale/i.test(text)) return 'sprint'
  if (/cooldown|cool down|recovery|descent|easy/i.test(text)) return 'recovery'
  if (/tempo|threshold|attack|breakaway/i.test(text)) return 'tempo'
  return 'flat'
}

const make = (texts: string[], type: DialogueType, topic: string, extra: Partial<JeanLine> = {}): JeanLine[] => texts.map((text) => ({ text, type, topic, ...extra }))
export const dialogueLibrary: Record<JeanMode, JeanLine[]> = {
  neutral: make(['Easy shoulders. Let the legs wake up.','Neutral road. Stay tucked behind the car.','Check the gear and breathe low.','No urgency yet. Hold your place.','Keep it conversational through the rollout.','Drink now while the road is quiet.','Save every match for the racing.','Smooth circles; let the body come around.','Stay with the team through neutral.','Wait for the flag, then we race.'], 'instruction', 'rollout', { preKmZeroOnly: true }),
  flat: [...make(['Settle into the wheels and hold this rhythm.','Good pressure. Keep the upper body quiet.','Let the group carry the speed.','Long road ahead; spend nothing unnecessary.','Cadence is good. Stay economical.','Hold the wheel and keep the air off you.','This is controlled riding. Keep it there.','Take a drink when the line is stable.','No need to chase every small move.','Keep the pedal stroke light and constant.','The rhythm is settling nicely.','Stay attentive without spending energy.'], 'observation', 'economy'), ...make(['Road opens ahead. Maintain position.','Wind is exposed here; stay sheltered.','Watch the wheel in front and leave room.'], 'warning', 'road')],
  tempo: [...make(['Hold the displayed power target.','Hold threshold without forcing the gear.','Keep this honest and repeatable.','Work starts again. Find the rhythm.','Strong tempo; stay inside yourself.','Close the gap steadily, not in one hit.','Take your turn, then slide back into shelter.','This is race pressure. Stay composed.','Use cadence and resistance together to hold the displayed power.','Hold it here; do not drift upward.'], 'instruction', 'tempo'), ...make(['The move is stretching the group.','Good response. You are still in control.'], 'observation', 'attack')],
  'time-trial': make(['Lock onto the pace. Every second matters.','Stay compact and keep pressure through the pedals.','Push the speed, but keep the effort clean.','Eyes forward, shoulders narrow.','Do not surge; build the speed patiently.','Hold the line and meter the effort.','Keep power smooth over the top.','Cadence steady; make the position fast.','Half a gear of pressure, nothing more.','Drive to the marker without breaking form.'], 'instruction', 'time-trial'),
  climb: [...make(['Find the rhythm and ride through the gradient.','Quiet upper body. Make the gear work for you.','Hold the line; the summit is coming back to us.','Sit tall and keep the breathing controlled.','Gear early before the road kicks.','Keep traction and turn the pedals cleanly.','Ride your number, not the riders surging past.','Stay seated and protect the legs.','The gradient bites; keep the cadence alive.','One steady effort all the way over.','Good climbing. Do not negotiate with the slope.','Road eases here; recover without losing speed.'], 'instruction', 'climb'), ...make(['Steeper ramp ahead. Select the gear now.','Summit is close. Ride through the crest.'], 'warning', 'gradient')],
  sprint: [...make(['Sprint coming. Start moving up.','Bring the cadence up. Stay controlled.','Find your position. Do not open it yet.','Protect the wheel; your launch is coming.','Hold the lane and wait for the call.','One wheel at a time. Move forward cleanly.','Stay patient in the draft.','Do not get boxed in. Keep an exit.'], 'tactical', 'position'), ...make(['Start winding it up.','Cadence rising. Commit to the wheel.'], 'instruction', 'launch', { phase: 'LAUNCH' }), ...make(['Go! Through the line.','Now—everything to the marker!','Full sprint. Drive past the line.'], 'encouragement', 'sprint', { phase: 'SPRINT' })],
  recovery: [...make(['Gear down. Drink, breathe, and reset.','Let the heart rate settle; no wasted pressure.','Good. Economical now; we need the legs later.','Shoulders loose and take the drink.','That effort is dealt with. Let it come back.','Easy cadence. Clear the legs.','Use this road to reset the breathing.','No pressure now; absorb the work.','Good. Settle back into the wheels.','Recovery is part of the race. Take it.'], 'recovery', 'recovery'), ...make(['Climb is behind us. Recover on the descent.','Sprint done. Find the group and settle.'], 'transition', 'continuity')],
  finish: make(['Across the line. That was disciplined racing.','Stage complete. Excellent work.','Good ride. Bring it home easy.','Finished. Team Loriot can be proud of that.','Line crossed. Start the recovery now.'], 'encouragement', 'finish'),
}

export function eligibleJeanLine(line: JeanLine, context: JeanContext) {
  return context.running && !(line.preKmZeroOnly && context.afterKmZero) && (!line.phase || line.phase === context.sprintPhase)
}

/** Final contextual gate; the canonical event bus still owns once-only dispatch. */
export function jeanCallIsCurrent(message: string, context: JeanGeographicContext, eventType?: string) {
  const preparing = /prepare(?: the gear)?(?: to climb)?|climb (?:is )?(?:ahead|in one minute)|lower slopes/i.test(message)
  if (preparing && context.activeClimbId && context.climbProgress > .15) return false
  const summitCall = /summit|crest/i.test(message)
  if (summitCall && (!context.activeClimbId || (context.distanceToSummit <= 0 && eventType !== 'summit'))) return false
  if (/one more push|one minute|final minute/i.test(message) && summitCall && context.distanceToSummit <= 0) return false
  if (/settle into tempo/i.test(message) && (context.currentGradient ?? 0) >= 8 && context.remainingOfficialTime <= 180) return false
  return context.courseDistance >= 0 && context.remainingOfficialTime >= 0
}

export class JeanMemory {
  private recent: JeanLine[] = []
  private readonly windowSize: number
  constructor(windowSize = 18) { this.windowSize = windowSize }
  select(context: JeanContext, seed = 0): JeanLine | null {
    let pool = dialogueLibrary[context.mode].filter((line) => eligibleJeanLine(line, context))
    if (!context.critical) {
      const recentTexts = new Set(this.recent.map((line) => line.text))
      const last = this.recent.at(-1)
      pool = pool.filter((line) => !recentTexts.has(line.text) && (!last || line.topic !== last.topic))
    }
    if (!pool.length) pool = dialogueLibrary[context.mode].filter((line) => eligibleJeanLine(line, context))
    const line = pool.length ? pool[Math.abs(seed) % pool.length] : null
    if (line) this.remember(line)
    return line
  }
  remember(line: JeanLine) { this.recent = [...this.recent, line].slice(-this.windowSize) }
}

const sharedMemory = new JeanMemory()
export function jeanCue(mode: JeanMode, event: string | undefined, recent: string[] = [], seed = 0, context?: Partial<JeanContext>) {
  if (event === 'final-30' && mode === 'sprint') return 'Thirty seconds. Move up, cadence rising—prepare to launch!'
  if (event === 'final-10' && mode === 'sprint') return 'Ten seconds. Go now—everything through the line!'
  if (event === 'final-10' && mode === 'climb') return 'Ten seconds to the summit. Drive over the top!'
  const line = sharedMemory.select({ mode, afterKmZero: context?.afterKmZero ?? mode !== 'neutral', running: context?.running ?? true, sprintPhase: context?.sprintPhase, critical: context?.critical }, seed)
  if (line && !recent.includes(line.text)) return line.text
  return line?.text ?? 'Radio quiet. Stay on the plan.'
}
