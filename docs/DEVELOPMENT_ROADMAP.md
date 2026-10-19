# Development Roadmap

## Now: Architecture Foundation

- [x] Web-first source of truth
- [x] Mission Control split into focused pages
- [x] Routine-first nutrition
- [x] Fueling guardrails
- [x] Voice food logging foundation
- [x] Career repository abstraction
- [x] Remove direct career persistence from UI/state consumers
- [x] Establish remote persistence schema and migration plan
- [ ] Split large feature screens into feature modules where useful
- [x] Mark 4.1.0 when the architecture boundary is stable

## Current: Durable Rider Data

Create an authenticated remote data model for:
- rider profile
- training plan and assignments
- training journal
- ride history
- nutrition entries and remembered meals
- recipe preferences
- recovery/readiness
- equipment
- settings

Requirements:
- preserve current local careers
- support migration without reducing ride/training history
- keep local cache for resilient startup
- make multi-device use possible

## Then: Training Intelligence 4.2

- Benchmark Block model
- block start/end comparisons
- weekly volume and time progression
- FTP and W/kg progression
- HR efficiency trends
- long-ride durability
- strength compliance
- fueling compliance
- recovery-week effectiveness
- adaptation reasons stored as evidence

## Then: Ride Platform 4.3

- canonical web cockpit
- stronger graphics hierarchy
- indoor/outdoor environment adaptation
- route intelligence
- sensor abstraction
- strength set/weight logging
- native shell only where hardware access is required
