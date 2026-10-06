export const TACTICAL_EVENT_TYPES = ['breakaway','chase','bridge','attack','counterattack','intermediate-sprint','kom-effort','positioning','defend-position','final-sprint','recover','sit-up'] as const
export type TacticalEventType = typeof TACTICAL_EVENT_TYPES[number]
export type TacticalChoice = { id: string; label: string; modifier: { ftpDeltaPercent: number; fatigueDelta: number } }
export type TacticalEvent = { id: string; type: TacticalEventType; trigger: { courseKm: number }; jeanPrompt: string; choices: [TacticalChoice, TacticalChoice]; acceptedModifier: TacticalChoice['modifier']; declinedModifier: TacticalChoice['modifier']; durationSeconds: number; cooldownSeconds: number; onceOnly: boolean }
export type RaceGroup = 'rider'|'peloton'|'breakaway'|'chase'|'leader'|'target'
export type GapTrend = 'opening'|'stable'|'closing'
export type RaceGapState = { eventId: string; riderGroup: RaceGroup; targetGroup: RaceGroup; gapSeconds: number; gapTrend: GapTrend; eventType: TacticalEventType }
export type TacticalState = { activeEvent: TacticalEvent | null; choiceId: string | null; fatigue: number; gap: RaceGapState | null; completedEventIds: string[] }

export const initialTacticalState = (): TacticalState => ({ activeEvent: null, choiceId: null, fatigue: 0, gap: null, completedEventIds: [] })

/** Pure, deterministic tactical overlay. It accepts course position but cannot return geography. */
export function triggerTacticalEvent(state: TacticalState, event: TacticalEvent, courseKm: number): TacticalState {
  if (courseKm < event.trigger.courseKm || (event.onceOnly && state.completedEventIds.includes(event.id))) return state
  return { ...state, activeEvent: event, choiceId: null }
}
export function decideTacticalEvent(state: TacticalState, choiceId: string): TacticalState {
  if (!state.activeEvent) return state
  const choice = state.activeEvent.choices.find(item => item.id === choiceId)
  if (!choice) return state
  const accepted = choiceId === state.activeEvent.choices[0].id
  return { ...state, choiceId, fatigue: Math.max(0, state.fatigue + choice.modifier.fatigueDelta), gap: {
    eventId: state.activeEvent.id, riderGroup: accepted ? 'breakaway' : 'peloton', targetGroup: accepted ? 'leader' : 'breakaway',
    gapSeconds: accepted ? 10 : 30, gapTrend: accepted ? 'closing' : 'opening', eventType: state.activeEvent.type,
  } }
}
export function completeTacticalEvent(state: TacticalState): TacticalState {
  if (!state.activeEvent) return state
  return { ...state, activeEvent: null, gap: null, completedEventIds: [...state.completedEventIds, state.activeEvent.id] }
}

export type { NormalizedTelemetry, RiderPerformance, DeviceAdapter } from './telemetry.ts'
import type { RiderPerformance } from './telemetry.ts'


/**
 * Evolves a tactical gap from rider performance only.
 * It cannot return or mutate professional geography.
 */
export function evolveRaceGapFromPerformance(
 state:TacticalState,
 performance:RiderPerformance,
 elapsedSeconds:number,
):TacticalState{
 if(!state.gap||performance.stale||performance.targetCompliance===null)return state
 const compliance=performance.targetCompliance
 const effort=compliance>=.9?-.7:compliance>=.7?-.2:compliance>=.5?.15:.55
 const fatiguePressure=Math.max(0,performance.fatigue-70)/100
 const delta=(effort+fatiguePressure)*Math.max(1,elapsedSeconds/10)
 const gapSeconds=Math.max(0,Number((state.gap.gapSeconds+delta).toFixed(1)))
 const gapTrend:GapTrend=delta<-.05?'closing':delta>.05?'opening':'stable'
 return {...state,gap:{...state.gap,gapSeconds,gapTrend}}
}

/**
 * Resolves a deterministic tactical outcome label from canonical tactical state
 * and rider performance. Geography remains external to this function.
 */
export function tacticalOutcome(
 state:TacticalState,
 performance:RiderPerformance,
):'NO_EVENT'|'STRONG'|'HOLDING'|'UNDER_PRESSURE'{
 if(!state.activeEvent&&!state.gap)return 'NO_EVENT'
 if(performance.stale||performance.targetCompliance===null)return 'HOLDING'
 if(performance.targetCompliance>=.9&&performance.fatigue<75)return 'STRONG'
 if(performance.targetCompliance>=.65&&performance.fatigue<90)return 'HOLDING'
 return 'UNDER_PRESSURE'
}
