# Ride the Races Architecture Contract

**Status:** Governing product and engineering specification
**Release baseline:** Alpha 4.0.18
**Change rule:** New features extend these canonical boundaries; they must not create parallel geography, prescription, tactical, or event engines. Engine correctness precedes Alpha 4.1 graphics.

## Product definition

Ride the Races is an indoor and outdoor cycling race simulation platform that translates real and historic professional races to the rider's fitness, available time, equipment, riding environment, and local terrain.

> **Core promise:** “Ride the race, not just the workout.”
> **North Star:** “What would it feel like if I were in that race?”

Professional and historical facts require recorded provenance. The system must never infer official markers from workout names or elevation peaks.

## Canonical layers

The seven connected but logically independent layers are:

1. **Official Geography:** Official Course → Course Distance → Elevation → Gradient → Climb Geometry → Official Course Markers.
2. **Stage Simulation:** Real Stage → Stage Character → Race Narrative → Rider Duration Selection → Time Compression Map → Simulation Sections.
3. **Rider Prescription:** Rider Fitness + Strategy + Simulation Section → Base Prescription → Terrain Modifier → Live Prescription.
4. **Tactical Race Simulation:** Race Narrative + Course Position + Rider Decisions + Rider Performance → Tactical State → Race Gap → Race Outcome.
5. **Jean Director:** Geography + Prescription + Tactical State + Race Narrative + Rider Performance → Jean Director → Display + Speech.
6. **Live Telemetry:** Device → Device Adapter → Normalized Telemetry → Rider Performance Model → Tactical Race Simulation.
7. **Environment Translation:** Canonical Stage Simulation → Indoor Adapter or Outdoor Route Engine → Rider Experience.

No layer may mutate another layer's owned state. In particular, prescriptions, FTP, strategy, telemetry, and tactics never move geography.

## Official geography contract

There is exactly one `courseDistance` and one `courseProgress`. Official geography owns `officialDistanceKm`, `courseDistance`, `courseProgress`, `riderPosition`, `riderElevation`, `currentGradient`, and profile geometry:

```
courseProgress = courseDistance / officialDistanceKm
```

At completion, `courseDistance === officialDistanceKm`, `courseProgress === 1`, and `riderPosition === 1`. UI components consume these values and may not independently integrate speed, elapsed time, or resistance into a competing position.

### Gradient and climb geometry

Gradient is road geography—not resistance, power, FTP percentage, or workout difficulty. The profile gradient, Live Climb CURRENT, Terrain Modifier input, and Jean gradient are the same authoritative value.

All climb consumers use one `ResolvedClimbGeometry`:

```ts
type ResolvedClimbGeometry = {
  climbId: string; climbStartKm: number; summitKm: number
  startElevation: number; summitElevation: number; elevationGain: number
  climbDistanceKm: number; averageGradient: number; currentCourseKm: number
  climbProgress: number; distanceToSummit: number
  currentGradient: number; nextGradient: number | null
}
```

The CURRENT bucket contains `currentCourseKm`. NEXT is the immediately following **ascending** bucket; absent is `null` and displays as `—`. A descent is never NEXT within a climb. At the exact summit, progress is 1, distance and ETA are 0, and NEXT is unavailable. Immediately after the summit `activeClimbId` is null; descent is ordinary road geography.

### Official markers

Markers are independent of workout sections, workout names, elevation peaks, and tactical events. Supported verified, provenance-bearing types are `start`, `km-zero`, `kom`, `sprint`, `bonus`, `tt-check`, and `finish`. Workouts cannot fabricate markers; peaks cannot fabricate KOMs.

## Stage simulation and adaptive duration

Duration selection belongs to Stage Simulation:

Real Stage → Canonical Race Narrative → Rider Duration Selection → Time Compression Map → Personalized Prescription.

Modes are `QUICK`, `STANDARD`, `EXTENDED`, `EPIC`, `CUSTOM`, and `RECOMMENDED`. They are engine capabilities and need not all be exposed in the 4.0.18 cockpit. Duration may change compression ratio and transition, recovery, sustained-interval, and tactical-event timing. It cannot change identity, official geography, climb/marker geometry or order, decisive-event order, or finish.

**Alpha 4.0.18 integration status:** duration modes are persisted per active ride, selected in the professional Race Briefing, and consumed by `RideScreen` and the simulator through the same `TimeCompressionMap`. The rider preference supplies the default; CUSTOM remains a bounded per-ride override. Training rides retain their authored duration.

Compression is weighted, never uniform: neutral road, valleys, transitions, and some recovery yield first; decisive climbs, sprints, KOM efforts, attacks, and race-defining finales have priority. Longer rides retain fatigue, sustained climbing, pressure, transitions, and buildup. Every duration remains recognizably the same race.

Recommended design ranges (guidance, not limits): short TT 30–45 minutes including warm-up; long TT 45–60; flat/sprint 60–75; rolling 60–90; hilly/Classics 75–90; medium mountain 75–105; major mountain 90–120; queen stage 105–120. EPIC may exceed 120 minutes.

## Prescription and road feel

The only pipeline is **Authored Prescription → Strategy Adjustment → Terrain Modifier → Displayed Live Prescription**. It may contain FTP intensity, watts, cadence, resistance guidance, zone, and purpose. FTP is the primary fitness anchor.

The deterministic Terrain Modifier receives the resolved strategy prescription, authoritative gradient, terrain type, and FTP. Positive pressure begins above about 2%; resistance increases smoothly, cadence can progressively decrease, and the lower power target may rise without exceeding the strategy-adjusted FTP ceiling. Outputs are bounded (guidance resistance approximately 20–88%, cadence floor 65 RPM); negative road gradient never creates negative effort. Resistance is equipment guidance, not a claim of exact physical or Peloton calibration.

Terrain never changes distance, progress, rider X, elevation, or marker geography. POWER, RESISTANCE, and CADENCE consume the same final live prescription.

## Jean Director and event identity

Jean is the race director and consumes canonical state; Jean never owns race state. One stable `JeanEvent.id` fans the same event instance to radio display and speech, preserving once-only semantics and parity.

Immediately before event-bus dispatch, a contextual validity gate checks current geography, prescription, tactical state, and lifecycle. “Prepare to climb” is invalid deep in a climb; “push over the summit” is invalid after crossing. Timer-delayed tempo, attack, and geographic calls are suppressed—not replaced with invented dialogue.

## TT start and completion

A TT is **Warm-Up → Start Gate → 3 → 2 → 1 → GO → Official Stage**. Jean calls the gate about 30 seconds before launch. Warm-up is not official time and official elapsed remains zero before GO.

`courseComplete`, `officialWorkoutComplete`, and `stageComplete` are separate. A professional `stageComplete` requires both geography and official workout completion. The tracker cannot reach 100% while meaningful official workout time remains.

## Tactical race foundation

`TacticalEvent` supports `breakaway`, `chase`, `bridge`, `attack`, `counterattack`, `intermediate-sprint`, `kom-effort`, `positioning`, `defend-position`, `final-sprint`, `recover`, and `sit-up`, with stable id, trigger, Jean prompt, two riding-safe choices, accepted/declined FTP-relative modifiers, duration, cooldown, and once-only behavior.

Choices such as JOIN BREAKAWAY / STAY IN PELOTON temporarily alter rider-relative prescription and fatigue—not professional watts or geography. An accepted break can progress attack/bridge → establish → settle. Declining preserves energy and changes later coaching/opportunities. Consequences are deterministic and understandable, never arbitrary random punishment.

`RaceGapState` is a tactical overlay containing event id, rider group, target group, nonnegative seconds, trend (`opening`, `stable`, `closing`), and event type. Groups include rider, peloton, breakaway, chase, leader, and target. It cannot redefine geography. This state is the Alpha 4.1 chase-line contract: UI may later render target, rider group, gap, trend, and event without inventing state.

## Telemetry boundary

The provider-neutral boundary is Device → Device Adapter → Normalized Telemetry → Rider Performance → Tactical Race Engine. Normalized optional inputs are power, cadence, resistance, heart rate, speed, and timestamp. The core has no Peloton dependency and does not implement unsupported APIs. Future adapters can cover smart trainers, power/cadence/HR sensors, and other equipment. Performance may affect attacks, breaks, chases, gaps, and Jean reactions, but never geography.

## Future: historical replay

Historical Race Replay is parked, not implemented in 4.0.18. Verified fixed events may later synchronize to verified geography; rider performance changes the rider's relationship to an event, not history. Results may measure time with an attack, maximum gap, rejoin time, climb performance, compliance, and choices. Getting dropped is not game over: Jean returns the rider to an appropriate stage prescription. Historical facts use the same provenance/non-fabrication rules.

## Future: environment translation and Outdoor Stage Match

Outdoor work is parked; 4.0.18 implements no mapping or provider API. Stage-experience translation accepts location, selected stage, preferences, fitness, equipment, constraints, provider-neutral route data, and produces candidate routes → terrain analysis → similarity → safety/routability filtering → best match. Google may be a provider but is never an architectural dependency.

A future `StageSimulationSignature` captures classification, workload, terrain sequence, climb count/characteristics, descent/recovery sequence, rolling pressure, sprint/KOM events, tactical opportunities, decisive finale, fatigue distribution, and narrative weights. It is shared race identity for indoor simulation, outdoor matching, and historical replay.

Outdoor has two explicitly separate geographic domains: professional geography owns narrative; local physical/GPS geography owns navigation. Translation connects but never aliases them. Safety outranks fidelity: routability, prohibited/access roads, continuity, surface, turns, traffic signals, preferences, and daylight may be considered. Jean must suppress efforts at unsafe intersections, hazardous descents, or unsuitable locations.

## Deterministic ride simulator and QA

The developer simulator accepts race, stage, FTP, strategy, duration mode, and tactical choices without a bike. At useful intervals and every transition it records official elapsed/remaining, canonical distance/progress/elevation/gradient, climb state/progress/distance, current/next prescription, live power/resistance/cadence, Jean event, tactical event/gap, and the three completion flags.

Regression invariants cover monotonic distance, bounded progress, exact finish, profile/gradient synchronization, climb entry/summit/post-summit, prescription handoff, terrain response, markers, Jean parity/suppression/once-only, tactical and gap lifecycles, completion, and duration geography invariance across all 42 stages where applicable.

Responsive browser QA is repeatable at 390, 393, 430, and desktop widths and checks overflow, overlap, core target/gradient/Live Climb/Current/Up Next readability, tactical tap targets, and reserved race-gap space. This is validation infrastructure, not an Alpha 4.1 redesign.

## Alpha 4.1 boundary

Alpha 4.1 owns improved elevation/profile and Live Climb graphics, chase-line and tactical UI, typography, storytelling, animation, and hierarchy. Alpha 4.0.18 supplies trustworthy state only: **engine first, graphics second**.
