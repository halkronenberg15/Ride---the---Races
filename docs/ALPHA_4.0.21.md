# Ride the Races — Alpha 4.0.21

## Stage 8 field-test response

Alpha 4.0.21 keeps the 4.0.20 duration-derived road model as the only clock and geography authority. Tactical overlays and Sprint Mode consume its current sector prescription; neither can advance distance, gradients, markers, sectors, cooldown, or the finish.

### Coupled Peloton targets

The equipment resolver now returns a power and cadence range, a resistance window of at most three points, one recommended `resistance @ cadence` start, two or three feasible pairings, an adjustment reason, ±5 W instructional tolerance, and the existing feasibility classification. Its editable calibration collection begins with field samples 100/35/114 W, 97/39/146 W, 94/45/197 W, 76/54/215 W, and 67/62/218 W. Samples are cadence-normalized, monotonized, and piecewise interpolated. These are reference observations—not universal device constants and not automatic Peloton control. A telemetry-ready gate requires six seconds outside tolerance before a new instruction.

### Event-driven racing

Permanent tactical buttons are removed. Jean can offer a deterministic breakaway or attack only at appropriate authored race sectors. The preview states duration, baseline/modified targets, resolved pairing, and return behavior. Declining is identity; accepting creates a prescription overlay. Return to Peloton linearly reduces that overlay over exactly 45 seconds and resolves the exact baseline at the rider's current canonical road position.

### Sprint Mode

Lead-outs and sprints expose BUILD, POSITION, LAUNCH, and SPRINT on the canonical sector clock. The current command dominates the card, the ten-second warning is visible, and the last five seconds expose deterministic 5–4–3–2–1 values. The resolver is reused for each phase; resistance is established early and cadence provides the final acceleration wherever feasible. Sprint Mode suppresses race tactics.

### Training separation

Training briefings now contain purpose, sectors, resolved targets, session goals, and START RIDE. Strategy selection, race tactics, points, race naming, and redundant workout-impact copy are absent. Training profile boundaries use cumulative workout seconds divided by total workout seconds; professional stages retain geographic marker positioning.

### Climb presentation and persistence

Detailed climb presentation requires an authored classification or a sustained combination of at least 3% average, 30 m gain, and 0.75 km. This presentation filter never changes authoritative gradient data. Active-ride restoration adds safe defaults for pending/history/active tactics, sprint state, and recommended pairing while retaining all 4.0.20 fields and ignoring legacy strategy as an input to new rides.

### Rider/equipment calibration pass 2

Workout CSV imports are attached to the selected equipment instance rather than becoming a named or universal rider curve. Rows containing only whole-workout average cadence, resistance, and power are retained as low-confidence aggregate evidence; dated evidence is sorted newest first and receives a recency weighting, while future stable interval samples can carry higher confidence. The recovery resolver now starts 95–115 W at approximately **36% @ 88 rpm**, with internally consistent low- and high-cadence alternatives. Endurance, tempo, threshold, and sprint targets use the same coupled selection path.

### Release-review calibration lifecycle

There is no user-facing upload step. When onboarding selects Peloton, `equipmentForDevices` copies the anonymous approved 88 rpm / 36% / 105 W aggregate seed onto `peloton-baseline-bike` and marks that equipment profile personalized. When an existing Alpha 4.0.20 career is restored, `migrateCareer` adds the same seed only to a Peloton instance that has no samples; existing samples and all unrelated saved state remain intact. Race and training briefings and the cockpit select that active equipment instance, and `bikeProfileForEquipment` merges its samples into the resolver profile used by the normal preview and road-model paths. No workout name, rider identity, or workout history is stored in the seed.
