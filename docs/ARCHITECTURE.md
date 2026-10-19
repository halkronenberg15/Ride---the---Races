# Ride the Races Architecture

Current architecture release: **4.1.0 Web-First Architecture**

## Product boundary

Ride the Races is now a web-first product. The web application is the source of truth for rider data, training logic, nutrition logic, Mission Control, ride history, and the canonical ride cockpit.

The standalone/native application is paused. If it returns, it should be a thin hardware shell for native capabilities such as sensors, background GPS, notifications, camera/files, HealthKit, and launch/deep-link support. It should not duplicate the training, nutrition, or cockpit product.

## Architectural rules

1. **One rider state**
   Training, rides, nutrition, recovery, equipment, preferences, and Mission France progress belong to one authoritative rider domain.

2. **Mission Control is navigation, not a mega-page**
   Mission Control is a compact operating hub. Feature areas open as focused pages.

3. **Engines contain decisions**
   Training adaptation, fueling, meal planning, ride prescription, readiness, and future Jimmy coaching logic belong in engine modules. Screens render results and collect input.

4. **Screens do not own persistence**
   UI components read and write through state/domain actions. Persistent storage is behind repository/service interfaces.

5. **Local storage is a cache/fallback, not the long-term database**
   The current local repository remains supported during migration. The next persistence provider will be account-backed remote storage.

6. **Web cockpit is canonical**
   Indoor and outdoor rides share the same core cockpit and prescription logic, with environment-specific presentation and sensors layered on top.

7. **No duplicate truth**
   Nutrition targets, workout targets, readiness decisions, and rider metrics should each have one authoritative implementation.

## Current layers

```
src/
  screens/       route-level product surfaces
  components/    reusable UI
  engine/        pure domain decisions and calculations
  state/         application state and domain actions
  services/      persistence, accounts, external boundaries
  data/          static/seed/catalog data
  types/         shared domain types
```

This structure is retained while features are gradually grouped behind clearer module boundaries. Large files should be split when a feature becomes independently navigable or testable.

## Persistence boundary

Career persistence must flow through a `CareerRepository` contract.

Current provider:
- Local browser storage
- synchronous first-render restore
- migration and backup protection

Remote provider foundation:
- authenticated Supabase account-backed persistence
- full CareerState cloud snapshots
- normalized rider, ride, training, nutrition, and readiness tables
- verified local-to-cloud writes with snapshot revision + normalized record checks
- normalized records persist before the full CareerState snapshot; the snapshot acts as the sync commit marker
- guarded cloud restore with pre-restore local backups
- local browser storage retained as the authoritative cache during migration
- multi-device authoritative sync and conflict resolution remain 4.1.x work

The UI must not care which provider is active.

## Mission Control modules

- Home / Today
- Training
- Nutrition
- Ride Data
- Recovery / Readiness
- Jimmy Coach
- Equipment
- Events / Trips

Only the first five are required for the 4.1 architecture milestone. Equipment and Events can be promoted into first-class modules as their workflows mature.

## Training architecture

Training data must preserve:
- plan blocks and recovery weeks
- assignments and substitutions
- same-day cycling + strength workload
- ride completion evidence
- benchmark blocks
- rider feedback
- adaptation decisions

The Base Block ending 2026-10-18 is Benchmark Block 001 and establishes the comparison format for future blocks.

## Nutrition architecture

Nutrition is routine-first and training-governed.

Order of authority:
1. training demand establishes fueling minimums
2. rider routine fills those minimums
3. saved/discovered meals add variety
4. weight-loss pressure is applied away from protected training fuel

Voice logging, remembered foods, weekly planning, shopping, and Fuel Command must all use the same nutrition state.

## 4.1.0 completion criteria

- Mission Control uses focused page navigation
- recipe detail interaction works reliably on mobile
- routine-first nutrition and fueling guardrails are live
- voice food logging has a review-before-log flow
- persistence is behind a repository contract
- architecture document lives in the repo
- no new screen writes directly to browser storage for career data
- build and tests pass

## Next milestones

### 4.1.x
Architecture hardening, regression fixes, mobile polish, repository coverage.

### 4.2.0
Training intelligence: block benchmarking, progression comparisons, compliance, fatigue/recovery adaptation, and stronger historical analytics.

### 4.3.0
Ride system: cockpit graphics, route intelligence, indoor/outdoor adaptation, sensor/hardware expansion, and strength logging polish.
