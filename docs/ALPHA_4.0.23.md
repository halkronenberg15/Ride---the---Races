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

## Runtime correction pass

The mass-start gate is now a single persisted lifecycle: prescribed pre-race warm-up, the authored 30- or 45-second Kilometre Zero block, one GO edge, then the first racing section. Explicit Grand Tour warm-up/KM0 sections are removed from the official road timeline and projected through this gate; Worlds receives the same gate without consuming Brossard Rollout. Skipping offsets only the remaining warm-up and is idempotent, so reload cannot bypass Kilometre Zero or advance the rider.

Climb View now renders connected paths cut directly from the verified elevation profile rather than vertical gradient bars. The canonical climb coordinate places the rider, a five-section moving window controls mobile density, and Current/Next guidance uses live equipment-resolved resistance. Geographic Full Stage/Climb selection is persisted independently from Overview/Detail density, with controls in a normal-flow footer.

Tactical offers now record their first offered time, expose a 20-second decision countdown, consume decline/expiry immediately, and use separate resolver-backed preview and effort timers. Active effort, 45-second Return to Peloton, and consumed history remain mutually exclusive and reload-safe.

## Mobile runtime follow-up

The Worlds hub thumbnail now keeps only the compact Mount Royal circuit callout; the full authored landmarks remain in Course Briefing. Overview and Detail are mutually exclusive regions within the same fixed profile footprint, with readable high-contrast current gradient, next boundary, resistance, and position context. Geographic Full Stage/Climb controls remain separate from that density choice and expose visible 44-pixel semantic buttons in the protected footer.

Climb Approach leaves the live road gradient authoritative and labels the first mountain section `CLIMB START` until the canonical entrance. At a gradient boundary the promoted section, resolver targets, highlight, and rider position change in one snapshot; the crossing reads `CHANGE NOW` rather than lingering at `0.0`. Future target previews are projections of the same live prescription object used at activation. Rider glyphs face the next increasing course coordinate while their canonical coordinates and profile geometry remain unchanged. Right-side information reserves room for the floating accessibility control, and safe-area bottom spacing keeps cockpit controls scrollable above Mobile Safari chrome.

The final presentation pass makes profile context lifecycle-aware (`READY`, `PRE-RACE STAGING`, `KILOMETRE ZERO`, `GO`, then the canonical racing context) and suppresses all climb presentation before racing. One lifecycle/event selector owns the single dismissible Jean banner, so active staging can never retain the pre-start instruction. Overview and Detail now replace one another for both Worlds and Grand Tour cockpits, while the independent geographic control remains available in one compact, high-contrast two-button footer. Once course movement begins, progress below one percent reads `<1% COMPLETE`; 100% remains reserved for the canonical finish.

The consolidated mobile cockpit collapses event identification after GO and moves Leave Cockpit below Ride Details with active-ride confirmation. One one-line Live Tracker owns tracker identity, section and zone; its compact authoritative clock precedes the profile, while gradient guidance exists only in Detail. A single combined Jean/race-situation banner follows the profile controls, then resolver targets, exact Up Next, tactics and canonical progress. Worlds profile groups use bounded B/C/P markers, KM0 reduces to a tick after movement, and Finish remains attached to the final canonical profile coordinate. Stage 9's scaled Villajoyosa warm-up and Kilometre Zero are unnumbered staging; Opening Mountain is official Racing Section 1.

The unified Race Book redesign, selectable section previews, Sprint View, intermediate sprint and KOM classifications, and expanded race content remain deferred to Alpha 4.0.25; Alpha 4.0.23 adds no placeholder runtime UI for them.

## Phone-test stabilization

The remaining mobile gaps came from a fixed 310–330px profile card, an `auto` footer margin, and a 52px footer inset that survived after the accessibility control moved away from the profile. The profile now sizes from a bounded 126px visualization plus a normal-flow, full-width footer: one control spans the row and two controls split it equally. The post-GO cockpit also removes its protected header offset. Climb Overview contains only the continuous mountain, rider, explicitly labeled climb completion, distance-to-summit and ETA; gradient/resistance boundary cards are exclusive to Detail.

Finish is now an SVG marker whose line begins at x=100 and the final source elevation; only its label shifts inward. Worlds B/C/P markers and the rider retain separate bounded coordinates. Tactical persistence records whether an accepted effort is an Attack or Chase, uses that identity through pause/reload, and resolves preview and active targets with the same authored multiplier. Returning to Peloton renders once in the tactical region. Jean staging copy is selected from the live gate, so it is replaced on the GO lifecycle edge.

The final boundary pass never substitutes Finish for missing ordinary gradient guidance: Detail reports `NO UPCOMING GRADIENT CHANGE` without a fabricated distance when the canonical model has no next meaningful boundary. The SVG Finish label uses a solid white fill on a compact translucent dark backing plate—without text strokes that distort in Mobile Safari—while its endpoint and final-elevation line remain unchanged. KM0's staging label alone shifts clear of the rider; its tick stays at canonical zero. Return to Peloton clears its transition exactly once at zero and restores the unmodified road prescription.

The connected Worlds Detail path now reads road-ahead changes exclusively from `canonicalCoursePosition`; section endpoints and Finish cannot become substitute gradient boundaries. The internal window percentage has been removed from Detail. Worlds group labels are bare, haloed B/C/P glyphs above thin stems, and a rider in ordinary `PELOTON` state shares the peloton's canonical coordinate (with label-only collision offsets); separation occurs only after an authored tactical state begins. Active and restored warm-up views derive Jean's instruction directly from the pre-race lifecycle, masking pre-start copy immediately.

Mobile Safari exposed that `preserveAspectRatio="none"` correctly stretches the course geometry but also stretches SVG text. Finish therefore keeps only its endpoint line in canonical SVG coordinates and renders its sole label as a system-font HTML overlay projected above-left of that endpoint. The compact backing plate sizes to the real text; no SVG text, `textLength`, `lengthAdjust`, or non-uniform label transform remains.

The authoritative Jean banner now performs lifecycle selection inside the rendered component. A persisted `PRE_RACE_WARMUP` phase wins synchronously over the initial or restored radio string, including Stage 10, so active warm-up can never expose the pre-start “Press Start Ride” instruction while React state catches up.
