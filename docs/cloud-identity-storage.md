# Cloud Identity + Athlete Storage

## Objective

One login should identify the same rider in Ride the Races and Mission France.

The shared cloud is not allowed to make ride completion dependent on connectivity. RtR saves locally first, then synchronizes.

## Current foundation

The repository now contains:

- `@rtr/athlete-contracts`: versioned shared athlete and ride types
- `@rtr/athlete-sync`: idempotent event ingestion
- `@rtr/athlete-cloud`: authenticated repository interface, HTTP adapter and offline write queue
- `infra/postgres/001_shared_athlete.sql`: initial Postgres storage model

## Identity contract

After sign-in both apps need a session containing:

- userId: authentication-provider subject
- athleteId: stable RtR/Mission France athlete key
- accessToken: short-lived credential for API requests

Neither mobile app should know another rider's athleteId through client-side filtering. Authorization belongs at the API/database boundary.

## First API surface

- GET /v1/athlete/profile
- PUT /v1/athlete/profile
- POST /v1/athlete/events
- GET /v1/athlete/events?after=<cursor>
- GET /v1/athlete/rides
- GET /v1/athlete/rides/:rideId

## RtR completion path

1. finish ride locally
2. persist local result
3. build ride.completed event
4. place event in pending cloud queue
5. attempt upload
6. retry after reconnect/app foreground until acknowledged

A network failure must never erase or invalidate the local ride.

## Mission France path

1. authenticate as the same athlete
2. request events after local cursor
3. ingest events idempotently
4. update local Mission France ride evidence
5. advance cursor only after successful processing

## Backend decision

The data model is intentionally standard Postgres plus bearer-token HTTP so the apps are not trapped behind one vendor SDK.

A managed Postgres/auth provider can implement the first backend quickly. The concrete provider should be selected before wiring production credentials, row-level security and mobile sign-in flows.

## Next implementation slice

1. choose managed auth/Postgres provider
2. provision dev environment
3. create API endpoint implementation
4. add iOS secure token storage
5. wire RtR mobile sign-in
6. wire Mission France sign-in
7. push a real completed test ride through cloud storage into Mission France
