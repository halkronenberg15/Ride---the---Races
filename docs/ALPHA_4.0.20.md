# Alpha 4.0.20 correction release

Alpha 4.0.20 removes the parallel time/geography interpretations exposed by the Stage 7 field test. The selected-duration stage timeline is authoritative for lifecycle, sector, distance, profile, gradient, climbs, markers, finish, and tactical availability. Neutral rollout and protected KM0 remain non-racing geography.

## Acceptance contract

- Stage 7 is checkpointed at 70, 80, and 105 minutes for monotonic distance/progress, synchronized sector and profile state, and bounded summit/marker projections.
- Peloton targets are feasible narrow ranges with a recommended start; unsupported equipment remains `UNAVAILABLE` and smart equipment remains guidance-only.
- The full profile and gradient blocks retain their dimensions. The cockpit contains sector, zone, timer, power, cadence, resistance, starting value, and compact next instruction. Landscape uses a two-column composition.
- Sprint and KOM markers remain authored geographic events. Only crossed events may be persisted; early termination cannot award future markers.
- Persistent tactical state supports peloton, attacking, breakaway, chasing, caught, dropped, and progressive return.
- Team Radio captions last 6–10 seconds, dismiss/replay without reflow, and retain a bounded history.
- The selected workout includes a normally five-minute cooldown after canonical race finish; official results freeze while recovery metrics remain separate. Skip/End controls may shorten it.
- Early termination records reason and canonical snapshot, retains proportional history credit, and never completes the stage.
- Every calendar month has a 44px Team Bus control and race navigation restores month context.

## Schema migration

Schema 4 is additive. Alpha 4.0.19 rider, equipment, season/race, health, ride history, settings, duration, and calibration fields are spread forward unchanged. New defaults cover calendar restoration and earned marker IDs. Active ride restoration independently defaults tactical state, transition, radio history, and marker awards.

## Deferred to 4.1

Opponent AI, probability, elaborate team orders, animations, full season points standings, real-time device telemetry/control, and audio narration remain outside this deterministic foundation.
