# Alpha 4.0.25 — personalized rider development

## Authorized baseline

This isolated environment intentionally had no `main` ref or Git remote. The authorized merged baseline was branch `work` at `697bc6578ae710d73f79091dd82ca116121596d9`. Before branching, all 284 tests, TypeScript, lint, production build, Alpha 4.0.19–4.0.24 audits, Stage 4 audit, manual-road-feel audit, diff check, and clean status passed. Alpha 4.0.25 was created directly from that commit as `codex/alpha-4.0.25`.

## Persistence and authorization

Schema 6 is additive. It spreads the complete prior career forward and defaults the new account-scoped `alpha4025` record. Existing rider, FTP/provenance, equipment/calibration, active-ride namespace, race history, season closure, archives, settings, Worlds state, Intro state, favorites, and entitlements remain intact. Migration is idempotent and tolerates absent new fields. Hal’s supplied plan and September 19 baseline are seeded only when the existing local career identifies `Hal Kronenberg` with FTP 206 W; other accounts never inherit Hal’s data.

Authentication remains the documented device-local adapter. There is no cloud synchronization, production authentication, direct WHOOP/Peloton/Garmin integration, or server authorization. Rider enrollment can legitimately issue a pathway entitlement; it cannot grant the owner role or administrative access.

## Personalization and series pathways

Rider category and series preference are distinct. Male recommends Standard RtR, Female recommends RtR Femmes, and Prefer not to answer requires an explicit choice. A recommendation is shown and can be changed. The authoritative engine returns the visible archetype, pathway, priorities, volume range, target mode, recovery frequency, cadence/instruction complexity, climbing/outdoor progression, assessments, camps, Jean profile, and a plain-language explanation.

Intro to Cycling remains identity-neutral. Beginner riders receive foundations and outdoor-readiness progression; experienced riders can enter an entitled series directly. Standard and Femmes season navigation is filtered by preference. The Femmes shell establishes a separate season/stage structure, calendar/navigation boundary, entitlement, persistence, standings-ready context and Jean context without copying the men’s calendar.

No Femmes development fixture is a production race. Production validation requires official source/reference, verification date, start/finish, distance, route profile and `profileVerified=true`. Complete researched Femmes race content remains Alpha 4.0.26 scope.

## Season, review and replay

The existing confirmed End Season action freezes its immutable results snapshot, archives the season, preserves completed/unlocked stages, and keeps replay activities separate from official progress. Alpha 4.0.25 additionally unlocks Off-Season Training and creates a review exclusively from available account data. Unavailable FTP trend, watts/kg, normalized power, fueling, or other missing evidence is labeled unavailable rather than inferred.

## Goals, camps and plan generation

The goals questionnaire controls camp choice, availability, schedule, duration, progression, indoor/outdoor balance, strength and recovery. Regeneration replaces only future work; completed/partial assignments survive by date. One primary 12-week plan is produced. Missed work is not stacked, and an RtR substitution satisfies its assignment rather than becoming bonus load.

Supported camp vocabulary includes Recovery & Reset, Aerobic Base, Altitude, Climbing, VO2max, Threshold & Time Trial, Strength & Torque, Endurance & Durability, Classics and Grand Tour Preparation. Only goal-relevant camps are selected. Every recommendation explains why, development purpose, duration/workload, entry requirements, session types, completion criteria, and next camp.

Normal weeks contain no more than two demanding cycling sessions. Monday is recovery, Tuesday Strength A, Wednesday aerobic, Thursday quality, Friday rest/opener, Saturday primary outdoor endurance, and Sunday adaptive endurance plus lighter Strength B. Weeks 4, 8 and 12 reduce load. Sunday responds only to fresh readiness and Saturday demand; stale health data cannot modify training.

## Hal’s plan

Hal’s known profile remains FTP 206 W, age 45, GC contender and sustained-power climber with Balanced progression. The plan starts September 21, 2026. Week 1 is transition; Weeks 2–3 base; Week 4 reduced plus FTP assessment; Weeks 5–7 climbing/threshold; Week 8 reduced; Weeks 9–11 progressive high-aerobic capacity/durability; and Week 12 consolidation plus reassessment. The Peloton 20-minute test remains authoritative; the companion derives approximately 217 W test average for FTP 206 using 95%, never hardcoding that value for others.

The September 19 outdoor baseline stores exactly 20.57 miles, 1:31:39, 13.5 mph, 721 WHOOP-reported feet, strain 15.1, 1,057 calories, 136/162 bpm, and the supplied heart-rate distribution. Power is absent and never estimated.

## Outdoor, strength, fueling and readiness

No-power outdoor prescriptions use heart rate, plain effort, talk test, duration, terrain, wind and recovery. Outdoor readiness is guidance, not certification. A power-meter installation enters `COLLECTING` calibration; indoor and outdoor watts are not presumed interchangeable.

Strength A/B are structured checklists emphasizing unilateral strength, posterior chain and core stability. Tuesday is the loaded session and Sunday is lighter, never immediately before Thursday quality. The design reference is the American Council on Exercise, “Strength Training for Cyclists: 3 Sample Workouts,” August 21, 2026: https://www.acefitness.org/resources/pros/expert-articles/9198/strength-training-for-cyclists/ . No maximal/grinding work or complex live timer is claimed.

Every assignment exposes primary, shortened, indoor, outdoor and recovery prescriptions plus distinct fueling demand. Endurance sessions of approximately 75–100 minutes start at 30–45 g carbohydrate/hour as appropriate. Saturday recovery explicitly prepares Sunday. The governing message is: **Fuel the work. Do not diet the ride.** RtR supplies workload and fueling guidance, not meal planning or calorie restriction.

Readiness displays source, data date, update time and the direct rider inputs. There is no unexplained composite percentage. Data older than one day is labeled stale and cannot change today’s plan.

## Jean and release boundaries

Jean’s off-season context supports reviews, camp/weekly purpose, fueling, outdoor, recovery and completion guidance. Generic training rejects unauthored summit, descent, attack, peloton, sprint, KOM and breakaway calls; explicit climbing training retains climbing guidance and professional race stages retain race calls. Existing expiry, restoration rejection, accessible presentation and lifecycle behavior remain authoritative.

Deferred: production identity/cloud authorization, automatic weather, direct device integrations, unrestricted AI coaching, complete Femmes race research, full Race Book, advanced Climb Preview, Sprint View overhaul, points/classifications overhaul, team-role simulation, and full Jean voice overhaul.

## Preview data transfer follow-up

Preview URLs have separate browser origins, so their local storage cannot see a career saved by the existing deployment. The owner-only **PREVIEW DATA TRANSFER — DEVELOPMENT ONLY** settings surface exports format `ride-the-races-career-export`, version 1. It contains the authenticated owner’s career, schema/application/timestamp metadata, rider summary, safe program entitlements, and a compatible paused active ride when available. Because the career is the account-scoped aggregate, this includes profile, FTP provenance, equipment/calibration, intake/development state, season/results/history/replays/archives, Intro/outdoor readiness, Worlds, favorites, settings, readiness, outdoor/strength activities, questionnaire, camps, plan/calendar/substitutions/fueling and FTP assessments, including unknown compatible career fields.

The export never contains the account record, password verifier, salt, session key/token, browser identifier, another rider, or global administration data. It is downloaded and imported locally; RtR does not upload it or send it to analytics. The JSON contains personal training information, is not encrypted, and should be stored securely. This development utility is not cloud synchronization or production portability.

Import parses and validates format/version, rejects malformed or future-schema files, shows rider identity and career counts, and requires explicit confirmation. It replaces rather than merges the destination career, rebinds it to the authenticated owner account, migrates it additively to schema 6, and preserves destination authentication credentials. Safe program entitlements transfer without granting the owner role. A Rider #1 preview can therefore become the imported Rider #15 career without duplicate identity or appended history. Repeating an import produces the same career.

Immediately before replacement, the complete destination career, safe entitlements and compatible active ride are stored under a versioned per-account recovery key. Restore is owner-only and confirmed. Failed validation performs no writes; a failed write rolls back career, active ride, entitlements and the prior recovery backup. Running rides block export/import. Only a paused ride with existing authoritative runtime state is portable; an incompatible ride is excluded and identified in preview.

End Season renders only when schema 6 identifies an active, unarchived season. It is absent for a new preview career with no official race history, blocked during an active ride, and becomes available after importing a qualifying career. Confirmation discloses incomplete stages; closure remains idempotent, replay-isolated, and unlocks off-season once.

## Authoritative readiness follow-up

Team HQ, Off-Season, Sunday adaptation and future Jean/calendar consumers use `projectReadiness`. There is no composite percentage: available sleep, external recovery, strain, fatigue, soreness, motivation and hydration inputs remain independently labeled, with source, entry date and update time. The categorical result is Ready, Proceed with control, Recovery recommended, or Update needed; it is guidance, not a medical measurement.

The daily rule compares ISO local-calendar dates rather than elapsed UTC hours. Any earlier local date is stale, displays its age, and cannot adapt training. Copy is phase-aware for racing, off-season, Intro, and ordinary training; the legacy “Race with discipline” string and unexplained ring are removed.
