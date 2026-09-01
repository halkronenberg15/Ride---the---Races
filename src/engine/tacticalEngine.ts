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

export type NormalizedTelemetry = { power?: number; cadence?: number; resistance?: number; heartRate?: number; speed?: number; timestamp: number }
export type RiderPerformance = { targetCompliance: number; fatigue: number; telemetryTimestamp: number }
export interface DeviceAdapter<DeviceSample> { normalize(sample: DeviceSample): NormalizedTelemetry }
