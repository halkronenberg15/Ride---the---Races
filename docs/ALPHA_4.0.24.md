# Alpha 4.0.24 — Stage 10 cockpit stabilization

Alpha 4.0.24 follows the merged Alpha 4.0.23 canonical cockpit work. Current prescribed Power, Cadence, and Resistance are now directly below the tracker/countdown (and any active tactical strip), use one larger type step, and remain a single three-column instruction row. Profile and its two independent controls follow; Jean, Up Next/actions, progress, ride control, official details, and Leave Cockpit retain normal document flow.

## Official detail contract

`View Ride Details` contains the official stage total, official elapsed and remaining values from the road model, followed by traveled/remaining course distance, the established Restart Stage / End Ride Early lifecycle controls, and `Hide Ride Details`. It contains no duplicated prescriptions or coaching. Pre-race warm-up and Kilometre Zero project zero official elapsed and cannot consume course distance.

## Jean presentation and course calls

New radio sentences have a seven-second presentation window. Replacement cancels the prior timer; manual dismissal remains immediate; unmount cleans the timer. Persisted radio timestamps prevent an expired restored sentence from flashing. Dismissal affects presentation only—race situation, tactical state, and radio history remain authoritative.

Course calls are keyed to canonical timeline boundaries, delivered at most once, and valid for the first 5–20 seconds (bounded to the first quarter of the destination section). Crossed-but-expired events are consumed, not queued. Summit/descent recovery therefore begins after the summit and cannot leak into the end of a descent or a later section.

## Climb and Stage 10 correction

The prior root cause was raw positive profile-run discovery plus an automatic transition driven by the unfiltered climb ID. One shared qualification requires at least 1 km, 30 m gain, and 2% average gradient (explicit authored climbs may opt in). The persisted presentation state enters at 1% canonical climb progress, exits at 99.5% after an eight-second minimum, and always exits immediately when the canonical climb ends. It records the latched eligible ID, automatic timestamps, manual selection, completed IDs and last canonical progress. A manual Full Stage selection blocks automatic entry; upcoming climbs never auto-open. Overview/Detail remains an independent preference.

Stage 10 regressions trace every supported duration, each exact boundary and the instant before it, monotonic position, the final instant, and canonical finish agreement. Display rounding is downstream of the floating-point schedule.

## Intro Cycling registration and progression

The follow-up specification defines Michelle as the first ordinary participant, not an application identity. A public register/sign-in surface creates independent password-authenticated local accounts, uses each preferred display name, and namespaces career and active-ride persistence by account. Existing device-local careers migrate to an owner account without losing their established data.

Enrollment offers Intro Cycling to everyone alongside Standard RtR and collects cycling, indoor/outdoor, FTP-knowledge, availability, duration, goal, equipment, confidence, accommodation and progression answers. The deterministic plan changes duration, FTP-relative conservatism, cadence complexity, recovery spacing, instruction density, climbing introduction, assessment timing, scheduled days, delivery mode and checklist timing. Its authored foundation rides are Bike and Rhythm Foundations, Cadence and Resistance Control, and Preparing for Longer and Outdoor Rides; riders with unknown FTP receive Intro Calibration first.

Intro completion separately reports indoor-program readiness, checklist-backed outdoor preparation and advanced-program readiness; it never certifies outdoor group-ride safety. The checklist covers fit/equipment, helmet, braking, shifting, looking back, signals, road awareness, group etiquette, hydration/fueling and supervised first-ride planning. A rider may request Outdoor Ride Readiness, RtR Femmes or Standard RtR without creating another account. A local owner may approve a request, and a protected RtR Femmes shell proves the entitlement boundary without inventing its ride library.

Account mode is visibly `LOCAL DEVELOPMENT`; multi-device enrollment is unavailable. Accounts, verifiers, sessions, requests, entitlements, careers and rides remain editable browser-local data. Production requires remote identity, database, secure server session, recovery/verification and server-side authorization. Timer/state-machine tests execute deterministic schedulers and projections in Node; a mounted React dependency could not be obtained in this environment, so real-browser effects and physical iPhone verification remain outstanding.

## Deferred to Alpha 4.0.25

Alpha 4.0.25 retains Race Book, Climb Preview, Sprint View, intermediate sprint/KOM points and classifications. It also owns the Rider Personalization Engine and broader Jean overhaul described in the architecture roadmap; none is partially implemented here.

Also deferred: end-of-season rider review, off-season goals questionnaire, rider-specific professional camp sequencing and Jean camp assessments. Camps are Transition, Aerobic Base, Altitude-inspired, VO₂ Development, Mountain, Classics, Threshold, Sprint, Time Trial, Lead-Out, Domestique, Race Craft, Outdoor Skills, Grand Tour Preparation and Pre-Season Race, together with VO₂-max development and reassessment.

## Physical-phone continuation: prescription and training lifecycle

Up Next now renders the resistance string from the same equipment-resolved `LivePrescription` snapshot as power and cadence; it no longer rebuilds a separate ± resistance range. Snapshot identity includes the authored section, resolver prescription, equipment calibration confidence and canonical gradient. At the controlled section boundary the preview and active snapshot are equal; tactical or rider changes are explicit snapshot reasons rather than mixed metric substitutions.

Unknown FTP is `null` with provenance `UNKNOWN`, never zero. Provenance is `MEASURED`, `RIDER_ENTERED`, `ESTIMATED`, `INTRO_EFFORT_BASELINE`, or `UNKNOWN`. Before FTP exists, Peloton-compatible rides show 65–80 rpm, RPE 2–3, and 25–30% for ordinary work (60–75 rpm, RPE 1–2, 20–25% in recovery). Non-compatible percentage equipment shows cadence/RPE and Light, Moderate, or Firm load language; smart power equipment labels power provisional. No-FTP riders receive the non-maximal 30-minute Intro Calibration Ride before watt-dependent foundations. Its controlled 55–75 rpm steps and two RPE checkpoints establish an Intro Effort Baseline only after rider entry; no guessed FTP is silently stored.

Jean now assigns each ride one coaching context: professional race, Worlds, recovery, leg opener, Intro Cycling, calibration, stage replay, or future off-season. Race-only sprint, peloton, attack, breakaway, and group-positioning copy is rejected outside compatible race/replay contexts. Exact `Title. Title` composition is normalized without removing legitimate repeated language. Stable cue identity, consumed expiry, and seven-second presentation remain unchanged.

The Team Bus order is Current Season, locked Off-Season Training, Training Library, then Team Roster. Training Library uses compact Recovery Rides, Intro to Cycling, and Classic Rides folders; assigned durations are primary and alternates sit behind Other Durations. Favorites are canonical stage references.

`END SEASON` requires confirmation and either final-stage completion or an owner early-end override. Its idempotent snapshot persists status, timestamp, reason, final completed stage, override, final results, ready-for-review handoff, and locked Off-Season folder. Past Seasons retains stages and results, and Ride Again creates a distinct `STAGE_REPLAY` activity without advancing or rewriting competitive progress. Completed activity details expose stored metrics, label missing values unavailable, and allow validated RPE/notes correction while retaining identity, original entry, and updated timestamp.

No hosted identity/database provider or approved environment configuration exists in this repository. The local provider interface remains a preview only. Production requires environment-specific provider endpoints/client identifiers, rider/profile/program/activity schemas, legacy migration jobs, secure sessions and recovery, and server-side row ownership plus entitlement authorization. Public and cross-device enrollment remains disabled.

## Final closeout: immutable replay targets and calibration response

Every newly completed activity stores an immutable `OriginalTargetSnapshot` per section: authored/resolved identity, power, cadence, resistance/load guidance, zone, section duration, equipment id/mode/calibration confidence, FTP and provenance, tactical modifier, and `alpha4024.2` prescription-rule version. `Use Current Targets` resolves against current profile and rules. `Use Original Targets` supplies the stored strings and durations directly to the replay cockpit; changing FTP or resolver rules cannot reconstruct or alter them. Historical activities without a complete snapshot set explicitly show Original Targets unavailable. Replay activities remain new `STAGE_REPLAY` records and cannot advance or rewrite archived progress/classifications.

Completed activity corrections are stored in `correctedEntry` while the first submitted values are deep-copied into `originalUserEntry`. Riders may correct actual duration, output, average/maximum power, cadence, resistance, average/maximum heart rate, distance, calories, Strive Score, RPE, notes, and equipment. Bounds and average≤maximum relationships are validated. Completion id/date, race/stage identity, planned duration, authored snapshots, and classification archives are immutable. Current Season stage details and Past Seasons both expose Stage Results; edited entries are labeled and show an original-versus-corrected comparison.

Intro Effort Baseline uses rule `alpha4024.2` and requires both recorded RPE and two completed checkpoints. Missing/incomplete baselines retain 65–80 rpm, RPE 2–3 and Peloton 25–30%. RPE ≥7 eases ordinary work to 60–72 rpm, RPE 2 and 23–28%; it does not mark the rider ready for the next ride. RPE 4–6 retains foundation targets. RPE ≤3 after controlled completion permits only a small progression to 68–82 rpm, RPE 3–4 and 27–32%. Recovery always remains 60–75 rpm, RPE 1–2 and 20–25%. Non-Peloton modes use the same decision but plain-language Light/Moderate load. Calibration never creates FTP.

## Mobile calibration closeout

No-FTP rides use one authoritative effort-mode projection. The three target columns are `EFFORT`, `CADENCE`, and `RESISTANCE`; the effort value is the current section RPE (for example `RPE 2–3`), never provisional watt copy. Active targets, Up Next, Detail, briefing previews, immutable original snapshots, and restoration consume the same `noFtpPresentation` result, so RPE/cadence/resistance transition together. Riders with established FTP retain Power/Cadence/Resistance.

Intro Calibration uses a dedicated short opening: “Settle in. Smooth pedals—today we’re finding your comfortable baseline.” Training openings do not use stage numbers, race strategy, team-objective language, or duplicate the ride title. The existing seven-second presentation, manual dismissal, consumed expiry, and accessible live status remain unchanged. Banner text is constrained to its grid column and wraps clear of the 44-pixel dismiss target.

Training Library is now a compact folder landing page. Recovery Rides, Intro to Cycling, Classic Rides, and Outdoor Ride Readiness each open as the sole folder inventory with Back to Training Library; Other Durations remains inside its folder. Team Roster remains on Team Bus and is not rendered on the training route. Training, briefing, onboarding, and Team HQ shells include `safe-area-inset-bottom` plus mobile Safari toolbar clearance, reduced to ordinary spacing on desktop.
