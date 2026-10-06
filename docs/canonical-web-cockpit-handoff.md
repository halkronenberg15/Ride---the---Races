# Canonical Web Cockpit Handoff

Ride the Races uses the web cockpit as the canonical ride-execution presentation surface.

## Product rule

The standalone app owns native shell concerns such as account access, device integration, background GPS, notifications, offline queueing and future BLE sensor adapters.

The web application owns the canonical briefing/cockpit presentation for planned training and race execution.

The standalone must not maintain a competing cockpit feature set.

## Launch contract

Standalone launches the web app with a non-sensitive navigation contract:

- `rtrLaunch=cockpit`
- `kind=training|race`
- training: `workoutId`, optional `assignmentId`
- race: `library`, `stage`
- `environment=INDOOR|OUTDOOR|AUTO`

No authentication tokens or secrets are placed in the URL.

The web app consumes the contract once, resolves the correct briefing/cockpit, then removes the query string from browser history.

## Environment resolution

Professional race geography and local outdoor geography remain independent domains.

- INDOOR uses the canonical stage/training simulation and indoor equipment adapter.
- OUTDOOR launches the outdoor briefing/route workflow when the selected assignment is outdoor-capable.
- AUTO preserves the canonical ride selection and lets the web experience resolve available environment context.

## Native fallback

The existing native cockpit remains a temporary fallback while launch handoff and device bridging are validated. New cockpit visual features should be implemented on web first and not duplicated in React Native.

## Strength logging

The standalone strength screen records sets completed and load used per exercise. Logs are stored locally for offline continuity and also emitted as `strength.completed` athlete events when the cloud rider is available.

## Future sensor bridge

Native device adapters will eventually normalize BLE/GPS data and bridge `NormalizedTelemetry` into the canonical web cockpit. The web cockpit remains provider-neutral.
