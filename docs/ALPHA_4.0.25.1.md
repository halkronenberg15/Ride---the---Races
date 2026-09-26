# Alpha 4.0.25.1 — authenticated off-season preview stabilization

## Why preview access exists

A migrated Rider #15 Vuelta career can display the official current race and remaining stages while the End Season visibility gate still evaluates the season as inactive. Alpha 4.0.25.1 therefore lets every account with a valid authenticated local session inspect the off-season experience while state reconciliation remains a follow-up.

## Access and safety contract

Preview access depends only on a persisted local account matching the active session. It does not depend on account role, rider identity, FTP, `season.active`, `offSeasonUnlocked`, imported career fields, or End Season completion. Unauthenticated visitors cannot enter the application or Off-Season route.

The preview does not end the current season, create an archive, freeze or alter results, complete Vuelta stages, change replay history, or grant an owner role. The current season and preview coexist.

## Hal plan restoration

When the authenticated career independently matches Hal Kronenberg, Rider #15, and the prior 206 W or current rider-reported 229 W FTP, the September 21, 2026 24-week plan is restored when missing or when migrating the old 12-week baseline. Stable assignment and baseline IDs make repeated access idempotent; existing plan completion, activities, strength history, assessments, fueling data, and readiness remain authoritative. The September 19 outdoor baseline retains its reported evidence and does not invent power.

## Follow-up

The migrated-season `active`/closure/official-race reconciliation and genuine End Season visibility repair remain intentionally outside this stabilization release.

## Transparent adaptive training

The off-season folder uses an original, versioned RtR curated-workout catalog and deterministic coaching rules. Safety filters run before documented weighted ranking. Zone development is an explainable workout-progression measure, not a physiological score. Individual difficulty compares curated workout difficulty with valid zone evidence; missing evidence stays unknown. The four-week preview reports schedule distribution and conflicts without forecasting FTP or guaranteed gains. Curated alternatives replace one assignment in place, preserve the original in adaptation history, and never create bonus workload.

## Executable off-season calendar

Every cycling assignment in the 24-week plan carries a stable curated workout ID. The referenced workout expands into timed training sections whose sum equals the displayed duration. Each section supplies zone/effort, FTP-relative targets with an effort fallback, cadence, supported resistance guidance, and training-context Jean coaching. Today’s quality action opens the existing Training Ride Briefing and its prominent Start Ride control, then uses the established live cockpit and completion lifecycle.

Completion is recorded against the original calendar assignment and updates account-scoped training history, zone evidence, and the four-week schedule view. Early endings remain partial, skips remain skipped, and curated replacements remain substitutions; the original assignment identity and explanation are retained and missed work is never added later as bonus workload.

Authenticated riders can open Recovery Rides, Intro to Cycling, Classic Rides, Outdoor Ride Readiness, and Off-Season Training from the Training Library. Off-Season also remains available from Team Bus and Team HQ. These training routes contain no End Season, season-state, role, FTP, rider-number, or series lock; the application-level authenticated-session boundary still protects rider data.

## Authoritative plan reconciliation and phone correction

The approved intake is now identified by a deterministic profile fingerprint covering FTP, rider profile, weekly days and minutes, goals, target event, start date, progression, indoor/outdoor preference, strength availability, and long-ride days. A generated plan records that fingerprint. A mismatch replaces only unfinished assignments in one persisted snapshot; completed and partial assignments keep their original identity and evidence. Hal's plan now targets 600 minutes on regular weeks across up to six training days, with every fourth week reduced and a back-to-back outdoor progression toward the long-term 100-plus-mile goal. The current rider-reported FTP is 229 W; the earlier 206 W value remains in historical records. The target event remains the Giro d’Italia. Failed schedule validation prevents a mixed plan from replacing the previous snapshot.

Week 1 targets 600 minutes: Tuesday 120 outdoor, Wednesday 45 indoor, Thursday 120 outdoor, Friday 75 indoor plus 30 strength, Saturday the original 90 outdoor, and Sunday 120 outdoor. Later regular weeks redistribute the 10-hour target toward longer consecutive weekend rides, up to 270 and 240 minutes. Recovery weeks shorten the workload. Rest and optional mobility carry zero workload. Wednesday's September 23 prescription is one stable `tempo-climb-45` identity everywhere: 4:30 warm-up; three 8:00 work intervals at 157–177 W, 70–85 rpm and moderate seated resistance; three 4:00 recoveries; and 4:30 cooldown, exactly 45:00. Its Quality fueling classification advises arriving fueled, 30 g carbohydrate/hour, about 500 ml fluid/hour, and recovery that supports the next scheduled workload.

Off-season curated rides use explicit time-based training mode. The briefing and cockpit display elapsed/remaining workout time and interval targets without turning minutes into kilometers or miles. Race stages retain their established course terminology and behavior. Mobile rules make preview access compact, collapse closed weeks to their summary height, keep headings light on dark surfaces, preserve 44px targets, wrap long text, and retain safe-area clearance.

## September 23 Peloton completion

Hal's September 23, 2026 Peloton ride is linked idempotently to the existing Week 1 Wednesday `w1-d3` / `tempo-climb-45` assignment. It marks that assignment completed and on target without creating a second calendar item; later schedule changes retain this completion. The stored external evidence includes the complete 45:00 duration, 151 W average, intentional 222 W warm-up spin-up, 80 rpm average cadence, 45% average resistance, 129/142 bpm average/maximum heart rate, zone distribution, 406 kJ output, RPE 4/10, and rider feedback.

This completion supplies low-confidence Tempo, Sustained Climbing, and Endurance workout-progression evidence only. The warm-up peak is not failed pacing, an FTP assessment, or VO2/anaerobic progression. The new 229 W FTP is based on the rider’s reported result, not inferred from this September 23 completion or an unverified Peloton sync. The reusable manual external-completion command requires an existing assignment/date/workout-ID match and is idempotent by external activity ID.
