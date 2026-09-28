# Shared Cloud Backend Setup

The standalone apps are being prepared around a shared Postgres + authentication backend.

The migration under `supabase/migrations` is written for Supabase because it provides Postgres, authentication and row-level security in one service while keeping the data model portable.

## What this gives us

- one account for RtR and Mission France
- one athlete ID across both apps
- cloud ride history
- append-only ride event stream
- Mission France automatic ride ingestion
- device sync cursors
- row-level security so a rider can only access their own records

## Environment contract

The mobile apps will eventually receive:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

No service-role key belongs in a mobile app.

## Production rule

Do not migrate the current RtR profile into cloud storage until:
1. the cloud project exists,
2. RLS tests pass,
3. a test rider can round-trip a ride between both standalone apps,
4. profile export exists,
5. Hal's production profile has a pre-migration backup.

## Next implementation milestone

Add a concrete Supabase adapter for `SharedAthleteAuth` and `SharedAthleteCloud`, wire sign-in to both app shells, and create the first end-to-end test:

RtR mobile -> complete mock ride -> cloud event -> Mission France mobile -> ride appears automatically.
