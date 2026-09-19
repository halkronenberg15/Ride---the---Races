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

## Intro to Cycling registration and progression

The follow-up specification defines Michelle as the first ordinary participant, not an application identity. A public register/sign-in surface creates independent password-authenticated local accounts, uses each preferred display name, and namespaces career and active-ride persistence by account. Existing device-local careers migrate to an owner account without losing their established data.

Enrollment offers Intro to Cycling to everyone alongside Standard RtR and collects cycling, indoor/outdoor, FTP-knowledge, availability, duration, goal, equipment, confidence, accommodation and progression answers. The deterministic plan changes duration, FTP-relative conservatism, cadence complexity, recovery spacing, instruction density, climbing introduction, assessment timing, scheduled days, delivery mode and checklist timing. Its authored foundation rides are Bike and Rhythm Foundations, Cadence and Resistance Control, and Preparing for Longer and Outdoor Rides; riders with unknown FTP receive Intro Calibration first.

Intro completion separately reports indoor-program readiness, checklist-backed outdoor preparation and advanced-program readiness; it never certifies outdoor group-ride safety. The checklist covers fit/equipment, helmet, braking, shifting, looking back, signals, road awareness, group etiquette, hydration/fueling and supervised first-ride planning. A rider may request Outdoor Ride Readiness, RtR Femmes or Standard RtR without creating another account. A local owner may approve a request, and a protected RtR Femmes shell proves the entitlement boundary without inventing its ride library.

Account mode is visibly `LOCAL DEVELOPMENT`; multi-device enrollment is unavailable. Accounts, verifiers, sessions, requests, entitlements, careers and rides remain editable browser-local data. Production requires remote identity, database, secure server session, recovery/verification and server-side authorization. Timer/state-machine tests execute deterministic schedulers and projections in Node; a mounted React dependency could not be obtained in this environment, so real-browser effects and physical iPhone verification remain outstanding.

## Deferred to Alpha 4.0.25

Alpha 4.0.25 retains Race Book, Climb Preview, Sprint View, intermediate sprint/KOM points and classifications. It also owns the Rider Personalization Engine and broader Jean overhaul described in the architecture roadmap; none is partially implemented here.

Also deferred: end-of-season rider review, off-season goals questionnaire, rider-specific professional camp sequencing and Jean camp assessments. Camps are Transition, Aerobic Base, Altitude-inspired, VO₂ Development, Mountain, Classics, Threshold, Sprint, Time Trial, Lead-Out, Domestique, Race Craft, Outdoor Skills, Grand Tour Preparation and Pre-Season Race, together with VO₂-max development and reassessment.

## Physical-phone continuation: prescription and training lifecycle

Up Next now renders the resistance string from the same equipment-resolved `LivePrescription` snapshot as power and cadence; it no longer rebuilds a separate ± resistance range. Snapshot identity includes the authored section, resolver prescription, equipment calibration confidence and canonical gradient. At the controlled section boundary the preview and active snapshot are equal; tactical or rider changes are explicit snapshot reasons rather than mixed metric substitutions.

Unknown FTP is `null` with provenance `UNKNOWN`, never zero. Provenance is `MEASURED`, `RIDER_ENTERED`, `ESTIMATED`, `INTRO_EFFORT_BASELINE`, or `UNKNOWN`. Before FTP exists, Peloton-compatible rides show 65–80 rpm, RPE 2–3, and 25–30% for ordinary work (60–75 rpm, RPE 1–2, 20–25% in recovery). Non-compatible percentage equipment shows cadence/RPE and Light, Moderate, or Firm load language; smart power equipment labels power provisional. No-FTP riders receive the non-maximal 30-minute Intro Calibration Ride before watt-dependent foundations. Its controlled 55–75 rpm steps and two RPE checkpoints establish an Intro Effort Baseline only after rider entry; no guessed FTP is silently stored.

Jean now assigns each ride one coaching context: professional race, Worlds, recovery, leg opener, Intro to Cycling, calibration, stage replay, or future off-season. Race-only sprint, peloton, attack, breakaway, and group-positioning copy is rejected outside compatible race/replay contexts. Exact `Title. Title` composition is normalized without removing legitimate repeated language. Stable cue identity, consumed expiry, and seven-second presentation remain unchanged.

The Team Bus order is Current Season, locked Off-Season Training, Training Library, then Team Roster. Training Library uses compact Recovery Rides, Intro to Cycling, and Classic Rides folders; assigned durations are primary and alternates sit behind Other Durations. Favorites are canonical stage references.

`END SEASON` requires confirmation and either final-stage completion or an owner early-end override. Its idempotent snapshot persists status, timestamp, reason, final completed stage, override, final results, ready-for-review handoff, and locked Off-Season folder. Past Seasons retains stages and results, and Ride Again creates a distinct `STAGE_REPLAY` activity without advancing or rewriting competitive progress. Completed activity details expose stored metrics, label missing values unavailable, and allow validated RPE/notes correction while retaining identity, original entry, and updated timestamp.

No hosted identity/database provider or approved environment configuration exists in this repository. The local provider interface remains a preview only. Production requires environment-specific provider endpoints/client identifiers, rider/profile/program/activity schemas, legacy migration jobs, secure sessions and recovery, and server-side row ownership plus entitlement authorization. Public and cross-device enrollment remains disabled.

## Final closeout: immutable replay targets and calibration response

Every newly completed activity stores an immutable `OriginalTargetSnapshot` per section: authored/resolved identity, power, cadence, resistance/load guidance, zone, section duration, equipment id/mode/calibration confidence, FTP and provenance, tactical modifier, and `alpha4024.2` prescription-rule version. `Use Current Targets` resolves against current profile and rules. `Use Original Targets` supplies the stored strings and durations directly to the replay cockpit; changing FTP or resolver rules cannot reconstruct or alter them. Historical activities without a complete snapshot set explicitly show Original Targets unavailable. Replay activities remain new `STAGE_REPLAY` records and cannot advance or rewrite archived progress/classifications.

Completed activity corrections are stored in `correctedEntry` while the first submitted values are deep-copied into `originalUserEntry`. Riders may correct actual duration, output, average/maximum power, cadence, resistance, average/maximum heart rate, distance, calories, Strive Score, RPE, notes, and equipment. Bounds and average≤maximum relationships are validated. Completion id/date, race/stage identity, planned duration, authored snapshots, and classification archives are immutable. Current Season stage details and Past Seasons both expose Stage Results; edited entries are labeled and show an original-versus-corrected comparison.

Intro Effort Baseline uses rule `alpha4024.2` and requires both recorded RPE and two completed checkpoints. Missing/incomplete baselines retain 65–80 rpm, RPE 2–3 and Peloton 25–30%. RPE ≥7 eases ordinary work to 60–72 rpm, RPE 2 and 23–28%; it does not mark the rider ready for the next ride. RPE 4–6 retains foundation targets. RPE ≤3 after controlled completion permits only a small progression to 68–82 rpm, RPE 3–4 and 27–32%. Recovery always remains 60–75 rpm, RPE 1–2 and 20–25%. Non-Peloton modes use the same decision but plain-language Light/Moderate load. Calibration never creates FTP.

## Mobile calibration closeout

No-FTP rides use one authoritative effort-mode projection. The three target columns are `EFFORT`, `CADENCE`, and `RESISTANCE`; ordinary sections show beginner language such as `VERY EASY`, never provisional watts or numeric RPE as the primary instruction. Active targets, Up Next, Detail, briefing previews, immutable original snapshots, and restoration consume the same `noFtpPresentation` result, so effort/cadence/resistance transition together. Numeric RPE remains available only at authored calibration checkpoints. Riders with established FTP retain Power/Cadence/Resistance.

Intro Calibration uses a dedicated short opening: “Settle in. Smooth pedals—today we’re finding your comfortable baseline.” Training openings do not use stage numbers, race strategy, team-objective language, or duplicate the ride title. The existing seven-second presentation, manual dismissal, consumed expiry, and accessible live status remain unchanged. Banner text is constrained to its grid column and wraps clear of the 44-pixel dismiss target.

Training Library is now a compact folder landing page. Recovery Rides, Intro to Cycling, Classic Rides, and Outdoor Ride Readiness each open as the sole folder inventory with Back to Training Library; Other Durations remains inside its folder. Team Roster remains on Team Bus and is not rendered on the training route. Training, briefing, onboarding, and Team HQ shells include `safe-area-inset-bottom` plus mobile Safari toolbar clearance, reduced to ordinary spacing on desktop.

## Merge-candidate phone stabilization

Ordinary unknown-FTP Intro to Cycling sections now present shared effort language (`VERY EASY`, `EASY`, `COMFORTABLE`, `MODERATE`, or explicitly authored `CONTROLLED HARD`) instead of numeric RPE as the primary instruction. Numeric RPE remains in the calibration model and the two `RPE CHECK` sections ask “How hard did that feel from 1–10?”; responses persist as checkpoint calibration data. The same effort projection supplies the tracker badge, active row, Up Next, Detail, briefing, restoration, and immutable original snapshots. Established-FTP rides retain Power.

The Intro Calibration Ride is authoritatively 30 minutes: 27 minutes of structured calibration followed by a three-minute cooldown. Training session time, completion, progress, distance and history use the full 30-minute clock. Expanded details say `SESSION`, use `Restart Ride`, coordinate distance rounding, and contain one Hide control; race rides retain Stage terminology.

Unknown FTP now reads `FTP NOT SET` and the Intro to Cycling plan reads `RPE-BASED TARGETS`. Intro-only recovery messaging is non-racing. `Intro to Cycling` is the canonical displayed program name. Training briefing guidance no longer says team objective, and its Back control restores the originating folder using session storage.

Mobile tracker typography increases one step. Team HQ, Training Library/folders, briefing, onboarding, pre-start and active cockpit retain top safe-area protection and additional bottom scroll clearance for Safari chrome. Open folder views omit the repeated Training Library hero so their Back control, title and content begin near the top.

## Alpha 4.0.24.1 physical-phone stabilization

The section countdown is centered as one nonwrapping time-and-label group below the unchanged tracker header. No additional Safari-preview bottom spacing is introduced: the reported obstruction belongs to Safari preview chrome and is absent from the saved Home Screen experience.

Unknown-FTP beginner steps now resolve through `beginnerSectionIntent` before every briefing, preview, active target, restoration, and completion snapshot. Intro Calibration progresses deliberately: Setup uses `VERY EASY · 55–65 rpm · 25–30%`; Light Load raises only load to `EASY · 55–65 rpm · 28–33%`; Check-In One holds that completed target; Moderate Rhythm moves to `COMFORTABLE · 65–75 rpm · 27–32%`; Check-In Two holds that target; Controlled Finish returns to `EASY · 60–70 rpm · 25–30%`; and cooldown settles at `VERY EASY · 55–65 rpm · 20–25%`. Non-Peloton equipment receives the equivalent Light, Light–Moderate, Moderate, or Very Light load guidance. The separate Intro `Cadence Change` moves from 60–70 to 68–78 rpm while keeping load stable.

Complete-session display time now projects one integer elapsed second first and derives remaining as `total − elapsed`. Therefore rendered elapsed plus remaining always equals total, the last active state is `29:59 + 00:01`, and completion occurs once at `30:00 + 00:00`. The engine continues to use its unrounded canonical clock for section transitions, pause/resume, and restoration.

## Alpha 4.0.24.1 contrast follow-up

Authentication now owns explicit semantic colors rather than inheriting the dashboard theme or WebKit defaults: `#f7f7f8` primary foreground, `#c7c7cf` supporting copy, `#ffad73` underlined links, `#ffffff` typed/autofill text on `#0d0d0f`, `#9b9ba5` placeholders, `#ffb4a8` errors, and `#ff7a16` focus rings. The orange registration action remains `#ff7a16` with `#111` text. WebKit autofill explicitly preserves the dark input fill and white text.

Enabled Training Library folders retain their light `#f4f1eb` card but now use `#171717` titles, `#4a4a52` descriptions, and `#7a3500` icons/actions. Disabled folders have a separate `#dedbd5`/`#74747c` contract, so enabled descriptions no longer resemble unavailable content. No cockpit or Safari-preview-spacing rule changed in this follow-up.

## Alpha 4.0.24.1 Jean activity-context blocker

Every transient Jean source is now checked against the active coaching context before it enters the event bus. Contexts distinguish professional race, Worlds, stage replay, ordinary training, recovery, leg opener, Intro to Cycling, calibration, outdoor activity, FTP assessment, and future off-season work. Training and Intro contexts reject climb, summit, descent, sprint, attack, breakaway, chase, peloton, KOM, and race-situation language unless the workout section explicitly authors a climbing, summit, descent, mountain, or ascent objective. Tactical language remains disallowed even in an explicitly authored climbing workout.

Decorative training profile geometry cannot authorize terrain coaching: Jean terrain events derive only from authored segment semantics. Crossed events that are incompatible with the active context are recorded as consumed before selection and can never replay later. Persisted radio entries now carry both coaching context and activity key; restoration removes a different-activity entry or any legacy entry whose copy is incompatible with the current workout. Persistent Worlds race-situation state remains separate from transient radio copy. Professional race climb and summit calls remain unchanged, as does the lifecycle-first seven-second presentation timer.
