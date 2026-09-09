# Alpha 4.0.23 — Cockpit stabilization and mountain visualization

Alpha 4.0.23 makes the road model the authoritative source for cockpit geography, timing, climb state, gradient boundaries, targets, and finish state. Vuelta Stage 9 is the primary 90- and 112-minute regression fixture.

## Runtime architecture

- `canonicalCoursePosition` projects one `RoadModel` snapshot into every geographic and timing value consumed by `RideScreen`.
- Verified profile climbs retain their source elevation shape. Insignificant adjacent gradient samples are merged for presentation; mobile windows are limited to five sections.
- Completion is capped below 100 while course distance remains. Summit distance and time become zero together at the canonical summit.
- Up Next uses the next ordered section's full scaled duration, independently of the current countdown and tactical overlays.
- Single-percent finishing prescriptions resolve from their FTP anchor, preventing zero-output finishing targets.

## Cockpit

The duplicated climb panel was removed. The primary profile card now owns Full Stage, Climb Approach, and Climb presentation. Tracker status is protected, training rides use `LIVE WORKOUT TRACKER`, timers and cards are more compact, and launch-pairing guidance remains diagnostic rather than a prominent active-cockpit line.

## Compatibility

Persistence remains additive. Existing career, calibration, results, equipment, events, authored situations, and active-ride records continue to use their established keys and defaults. No official course distance, ascent, marker, or race was changed.
