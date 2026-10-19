# Ride the Races 4.1.0

RtR 4.1.0 is the Web-First Architecture release.

## Included
- Mission Control focused pages
- reliable recipe detail opening on mobile
- routine-first meal planning
- fueling guardrails
- voice food logging with review before save
- CareerRepository persistence boundary
- Supabase rider backend using the existing athlete_id identity model
- full CareerState cloud snapshots
- normalized cloud tables for rides, training, nutrition, readiness, and rider profile
- verified cloud sync
- guarded cloud restore with local backup before replacement

## Data safety
Local browser storage remains the primary copy during the 4.1 migration period. Cloud writes are verified, and cloud restore requires comparison and explicit confirmation.

## Next
4.1.x will focus on automatic cloud mirroring, multi-device state selection, conflict handling, account cutover, and architecture hardening.
