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

Enrollment offers Intro Cycling to everyone alongside Standard RtR and collects cycling, indoor/outdoor, FTP-knowledge, availability, duration, goal, equipment, confidence, accommodation and progression answers. The deterministic plan changes duration, FTP-relative conservatism, cadence complexity, recovery spacing, instruction density, climbing introduction, assessment timing, scheduled days, delivery mode and checklist timing. Its three authored rides are Bike and Rhythm Foundations, Cadence and Resistance Control, and Preparing for Longer and Outdoor Rides.

Intro completion separately reports indoor-program readiness, checklist-backed outdoor preparation and advanced-program readiness; it never certifies outdoor group-ride safety. The checklist covers fit/equipment, helmet, braking, shifting, looking back, signals, road awareness, group etiquette, hydration/fueling and supervised first-ride planning. A rider may request Outdoor Ride Readiness, RtR Femmes or Standard RtR without creating another account. A local owner may approve a request, and a protected RtR Femmes shell proves the entitlement boundary without inventing its ride library.

Account mode is visibly `LOCAL DEVELOPMENT`; multi-device enrollment is unavailable. Accounts, verifiers, sessions, requests, entitlements, careers and rides remain editable browser-local data. Production requires remote identity, database, secure server session, recovery/verification and server-side authorization. Timer/state-machine tests execute deterministic schedulers and projections in Node; a mounted React dependency could not be obtained in this environment, so real-browser effects and physical iPhone verification remain outstanding.

## Deferred to Alpha 4.0.25

Alpha 4.0.25 retains Race Book, Climb Preview, Sprint View, intermediate sprint/KOM points and classifications. It also owns the Rider Personalization Engine and broader Jean overhaul described in the architecture roadmap; none is partially implemented here.

Also deferred: end-of-season rider review, off-season goals questionnaire, rider-specific professional camp sequencing and Jean camp assessments. Camps are Transition, Aerobic Base, Altitude-inspired, VO₂ Development, Mountain, Classics, Threshold, Sprint, Time Trial, Lead-Out, Domestique, Race Craft, Outdoor Skills, Grand Tour Preparation and Pre-Season Race, together with VO₂-max development and reassessment.
