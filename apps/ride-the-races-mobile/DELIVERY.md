# RtR standalone delivery

Ride the Races mobile is intended to ship as a real installed iOS app.

## Delivery model

- EAS Build creates signed standalone iOS binaries.
- EAS Update ships compatible JavaScript, TypeScript, assets, training logic, stage data, nutrition logic, and UI changes over the air.
- Native dependency, permission, entitlement, or runtime changes require a new EAS Build.
- GitHub Actions owns routine publishing once account linking is complete.

## One-time account setup

The repository intentionally does not contain Expo tokens or Apple credentials.

Before automation is enabled:

1. Link this app to the owner's Expo/EAS project from apps/ride-the-races-mobile.
2. Run EAS Update configuration once so Expo writes the project ID and update URL into app configuration.
3. Complete the first iOS EAS build interactively so Apple signing credentials are established.
4. Create an Expo access token and save it in GitHub Actions as the EXPO_TOKEN secret.
5. Set the GitHub Actions repository variable EAS_AUTOMATION_ENABLED to true.

After that setup, routine OTA publishing and iOS cloud builds do not require the local Mac or Metro.

## Channels

- preview: internal standalone builds and pre-production OTA updates.
- production: App Store/TestFlight builds and production OTA updates.

Runtime compatibility is tied to the app version. Native changes require a new binary/app version before updates for that runtime are published.
