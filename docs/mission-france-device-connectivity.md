# Mission France device and app connectivity

Mission France is a standalone app, but its coaching brain is designed to consume evidence from multiple rider-authorized sources.

## Connection model

There are three paths:

1. **Live sensors**
   - Bluetooth cycling power meters
   - cadence / heart-rate sensors where supported
   - used primarily by Ride the Races during ride execution
   - completed ride data flows into Mission France through the shared athlete cloud

2. **Cloud account connectors**
   - WHOOP
   - Garmin
   - Wahoo
   - Strava
   - Peloton when a supported authorization/import path is available
   - Zwift when a supported authorization/import path is available

3. **Phone health platforms**
   - Apple Health / HealthKit on iOS
   - Health Connect on Android

Mission France must never require the rider to enter the same ride twice.

## AI rule

The AI does not query random devices directly. Connector adapters normalize authorized data into typed observations with provenance. The coaching engine receives those observations as evidence.

This gives us:
- a clear record of where every metric came from
- duplicate protection
- source precedence when the same ride appears in RtR, Garmin and Strava
- explicit permissions
- the ability to disconnect a provider without breaking the coach

## Source precedence

Prefer original measurements over aggregators.

Examples:
- RtR or the original head unit over a Strava copy of the same ride
- a directly connected power meter over inferred power
- WHOOP recovery/sleep records over a manually retyped number
- manual entry remains available but carries lower provenance confidence unless the rider explicitly confirms it

## Provider constraints

A connector is only production-enabled when the provider offers a supported authorization or data path that we can use legally and reliably. The architecture includes Peloton and other platforms as targets, but the app must not depend on undocumented private APIs.

## Privacy

Every external connection is opt-in. The rider controls which source is connected and which capabilities are granted. Mission France uses only the authorized metrics required for coaching.
