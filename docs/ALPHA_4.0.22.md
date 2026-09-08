# Ride the Races Alpha 4.0.22

## Montréal 2026 data boundary

The dates, disciplines, distances, total ascent, 13.4 km Mount Royal circuit, 269 m circuit ascent, 12 laps, start/finish and named landmarks come from the [official UCI release](https://www.uci.org/pressrelease/200-days-to-go-a-look-at-the-courses-of-the-2026-uci-road-world/7MNCbBHZySudjNAoDW4R8x). Exact intermediate coordinates, profile samples, indoor timing, gaps and tactical moments are explicitly authored **Ride the Races interpretations**, not UCI data or live telemetry.

Only Elite Men ITT (20 September) and Elite Men Road Race (27 September) are included. Worlds temporarily presents TEAM USA without changing the rider's Team Loriot career affiliation. Results record completion independently for each discipline; rainbow bands require a deterministic first-place result and are never inferred from completion.

## Workouts and canonical course

The ITT offers 30, 40 and 50 minutes across nine proportionally scaled sectors. Its split IDs and coordinates are stable, it has no Sprint/KOM or race tactics, and cooldown is inside total time. The Road Race offers 70, 80 and 105 minutes across thirteen grouped sectors. A single timeline owns time, distance, gradient, marker crossings and finish. The final 160.8 km maps deterministically to Mount Royal laps 1–12 rather than duplicating twelve workout cards.

## Authored race situations and Chase

The reusable race-situation model keeps course position separate from authored peloton, breakaway, chase and simulated-gap presentation. Alpha 4.0.22 supplies a complete eight-event story only for the Montréal Road Race. Each event has a stable ID, canonical range, Jean caption, simulated group/gap, actions, preview/accepted prescriptions, decline behavior and deterministic resolution. Chase and Hold Position are contextual; tactical effort uses the active equipment resolver and never moves geography. Return to Peloton remains a paused/persisted 45-second progressive transition to exactly 1.0.

## Contextual profile and gradients

OVERVIEW and DETAIL are presentation states over the same rider coordinate. Qualifying authored Chase, attack, sprint, short-climb and rapid-terrain ranges may auto-open once. Manual switching changes no ride state; expiry and cooldown restore Overview, and reduced-motion changes immediately. Gradient number, next block, highlighted block, direction, transition distance, profile and resistance all read the canonical coordinate. Resistance inversions require a visible `POWER TARGET`, `TACTICAL EFFORT`, `RECOVERY TARGET` or `CALIBRATION LIMITED` explanation. The Stage 7 3.4%/46% to 1.9% fixture guards against an unexplained rise to 48%.

## Persistence and deferred work

Migration is additive and preserves rider, FTP, equipment calibration, Team Loriot affiliation, health, season, history, settings and active rides. Worlds results, ITT splits, event decisions, radio history, legitimate titles and profile view have additive defaults. Opponent telemetry, dynamic AI and production voice remain deferred. Tour and Vuelta stories are deliberately unchanged; individually authored stage stories will follow Montréal field testing.

## Runtime integration review

The follow-up runtime pass connected scaffolding that was not previously consumed by the cockpit. `RideScreen` now changes the live SVG `viewBox` for Detail while preserving the approved profile wrapper height; transforms HTML rider, course, and race-position markers into that same viewport; persists automatic/manual view state in the active ride; and renders canonical current/next gradients, ordered blocks, transition distance, rider position, and resolver output. ITT split crossings now enter persisted earned-marker state. The Montréal Road Race draws authored breakaway, Chase group, and peloton markers, presents Chase/Hold Position before activation, changes the live prescription through the existing tactical multiplier after acceptance, and retains the existing progressive Return to Peloton control. Completion returns to the remembered September calendar and records a completion without inventing a placing.
