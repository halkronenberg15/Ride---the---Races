# Standalone App Architecture

## Product split

### Ride the Races
Ride execution product:
- race and stage experiences
- indoor and outdoor workouts
- cockpit and live ride state
- training plan execution
- FTP, equipment and ride history
- Jean race/training guidance

### Mission France
Athlete development product:
- nutrition and fueling
- recovery and sleep context
- strength training
- body composition
- long-term climbing and durability development
- trip preparation
- Jimmy AI coach

## One rider, two apps

Both apps use the same rider identity and shared athlete data contract.

Ride the Races is the authoritative writer for completed ride activity.
Mission France consumes completed ride events automatically and uses them as evidence for training load, durability, fueling, recovery and long-term development.

The rider should never have to manually re-enter an RtR ride into Mission France.

## Sync rule

A completed RtR activity emits a versioned `RideCompletedEvent`.

Mission France ingests the event idempotently by `eventId` and stores the shared `rideId`.
Duplicate delivery must never create a duplicate ride.

Offline-first clients may queue events locally and upload them when connectivity returns.

## Identity

Both apps must authenticate to the same rider account. Local browser-only identity is not sufficient for standalone apps.

The next backend milestone is shared cloud identity + rider data sync. Until that exists, the current RtR PWA remains the production source of truth.

## Mobile direction

The standalone shells are scaffolded with Expo / React Native so we can target iOS first while keeping Android available.

Shared domain contracts remain plain TypeScript and must not depend on React Native or browser APIs.

## Migration strategy

1. Keep current RtR production stable.
2. Build shared athlete contracts.
3. Stand up RtR mobile shell.
4. Stand up Mission France mobile shell.
5. Add shared authentication and cloud athlete store.
6. Add RtR ride-completion event upload.
7. Add Mission France event ingestion.
8. Port existing RtR features screen-by-screen.
9. Port the current Mission France prototype from PR #50.
10. Cut over only after history migration and phone acceptance testing pass.

## Non-negotiable data rules

- no silent history loss
- no duplicate rides
- completed ride records are immutable except through explicit correction
- each event and entity is versioned
- sync conflicts are surfaced, not silently overwritten
- both apps remain usable offline for core workflows
