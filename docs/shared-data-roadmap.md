# Shared Data Roadmap

## Goal

Ride the Races and Mission France are separate mobile apps with one rider identity and one shared athlete data backbone.

## Write ownership

- Ride the Races owns completed ride creation and corrections.
- Mission France consumes ride events and owns nutrition, recovery, strength, body-composition and coaching data.
- Shared profile fields use explicit versioned updates.

## Phase 1: local contract

Implemented now:
- versioned athlete + ride contracts
- ride.completed event
- idempotent Mission France ingestion
- event cursor abstraction
- in-memory development adapters

## Phase 2: cloud identity + storage

Next:
- shared authentication
- cloud athlete profile
- append-only athlete event stream
- ride table keyed by rideId
- processed-event table keyed by eventId
- per-device sync cursor
- encrypted secrets and environment separation

## Phase 3: RtR producer

When an RtR ride is committed:
1. save the local ride first
2. enqueue ride.completed
3. upload when online
4. retry safely until acknowledged
5. never block ride completion on network availability

## Phase 4: Mission France consumer

On app launch, foreground and pull-to-refresh:
1. fetch events after the local cursor
2. process idempotently
3. update Mission France ride evidence
4. advance cursor only after successful processing

## Phase 5: corrections

Ride edits emit ride.corrected with a new eventId and the same rideId.
Mission France applies corrections without creating a second ride.

## Data rule

The event bus is a synchronization mechanism, not a second source of truth. Each domain has a clear owning app and entity key.
