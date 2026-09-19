# Alpha 4.0.25.1 — authenticated off-season preview stabilization

## Why preview access exists

A migrated Rider #15 Vuelta career can display the official current race and remaining stages while the End Season visibility gate still evaluates the season as inactive. Alpha 4.0.25.1 therefore lets every account with a valid authenticated local session inspect the off-season experience while state reconciliation remains a follow-up.

## Access and safety contract

Preview access depends only on a persisted local account matching the active session. It does not depend on account role, rider identity, FTP, `season.active`, `offSeasonUnlocked`, imported career fields, or End Season completion. Unauthenticated visitors cannot enter the application or Off-Season route.

The preview does not end the current season, create an archive, freeze or alter results, complete Vuelta stages, change replay history, or grant an owner role. The current season and preview coexist.

## Hal plan restoration

When the authenticated career independently matches Hal Kronenberg, Rider #15, FTP 206 W, the September 21, 2026 twelve-week plan is restored only when absent. Stable assignment and baseline IDs make repeated access idempotent; existing plan completion, activities, strength history, assessments, fueling data, and readiness remain authoritative. The September 19 outdoor baseline retains its reported evidence and does not invent power.

## Follow-up

The migrated-season `active`/closure/official-race reconciliation and genuine End Season visibility repair remain intentionally outside this stabilization release.
