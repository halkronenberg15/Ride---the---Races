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
