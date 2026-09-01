export type JeanEvent = {
  id: string
  type: string
  message: string
  speakable: boolean
  priority: number
  once: boolean
}

export type JeanEventLifecycle = {
  event: JeanEvent
  triggered: boolean
  displayed: boolean
  speechRequested: boolean
  speechSucceeded: boolean
  speechUnavailable: boolean
  acknowledged: boolean
}

export type JeanDispatchContext = {
  courseDistance: number
  activeClimbId: string | null
  summitDistance: number | null
  climbProgress: number
}

/** Geographic calls are suppressed when their canonical context has expired. */
export function isJeanEventContextValid(event: JeanEvent, context: JeanDispatchContext) {
  const message = event.message.toLowerCase()
  if (/prepare to climb|climb (?:is )?ahead/.test(message)) return context.activeClimbId === null
  if (/summit|over the crest/.test(message)) return context.activeClimbId !== null
    && context.summitDistance !== null && context.courseDistance <= context.summitDistance
    && context.climbProgress < 1
  return true
}

/** A single event instance fans out to radio and audio with independent state. */
export class JeanEventBus {
  private lifecycle = new Map<string, JeanEventLifecycle>()

  dispatch(event: JeanEvent, display: (event: JeanEvent) => void, speech: (event: JeanEvent) => boolean): JeanEventLifecycle
  dispatch(event: JeanEvent, display: (event: JeanEvent) => void, speech: (event: JeanEvent) => boolean, context: JeanDispatchContext): JeanEventLifecycle | undefined
  dispatch(event: JeanEvent, display: (event: JeanEvent) => void, speech: (event: JeanEvent) => boolean, context?: JeanDispatchContext) {
    const prior = this.lifecycle.get(event.id)
    if (event.once && prior?.triggered) return prior
    if (context && !isJeanEventContextValid(event, context)) return undefined
    const state: JeanEventLifecycle = {
      event, triggered: true, displayed: false, speechRequested: false,
      speechSucceeded: false, speechUnavailable: false, acknowledged: false,
    }
    display(event)
    state.displayed = true
    if (event.speakable) {
      state.speechRequested = true
      state.speechSucceeded = speech(event)
      state.speechUnavailable = !state.speechSucceeded
    }
    this.lifecycle.set(event.id, state)
    return state
  }

  get(eventId: string) { return this.lifecycle.get(eventId) }
  reset() { this.lifecycle.clear() }
}

export function createJeanEvent(id: string, type: string, message: string, priority = 0): JeanEvent {
  return { id, type, message, speakable: true, priority, once: true }
}
