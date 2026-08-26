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

/** A single event instance fans out to radio and audio with independent state. */
export class JeanEventBus {
  private lifecycle = new Map<string, JeanEventLifecycle>()

  dispatch(event: JeanEvent, display: (event: JeanEvent) => void, speech: (event: JeanEvent) => boolean) {
    const prior = this.lifecycle.get(event.id)
    if (event.once && prior?.triggered) return prior
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
