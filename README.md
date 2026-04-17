# Veloura AI

Expo Router MVP for an AI photo and video generator with a premium dark-violet aesthetic.

## What is wired

- Splash, onboarding, paywall, exit offer, image/video/history roots, generators, processing, result, settings.
- `mock/live` backend mode using Expo environment variables.
- RevenueCat-ready purchase adapter with Expo Go preview-safe fallback.
- Persistent local state for onboarding, history, jobs, and settings.

## Environment setup

Copy `.env.example` to `.env.local` and set the values you need:

```bash
EXPO_PUBLIC_API_MODE=live
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
EXPO_PUBLIC_PURCHASE_MODE=revenuecat
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default
```

Notes:

- Expo only inlines variables that use `process.env.EXPO_PUBLIC_*` with dot notation.
- `EXPO_PUBLIC_*` values are visible in the client bundle, so do not put private secrets there.
- RevenueCat public SDK keys are safe to expose in the client app.

## Backend expectations

The live adapter expects the endpoints described in the product spec:

- `GET /settings/bootstrap`
- `GET /history`
- `GET /entitlements`
- `POST /generation/image`
- `POST /generation/video`
- `GET /generation/{jobId}`
- `POST /restore-purchases`

The client sends `X-Account-Id` with each request so the backend can reconcile anonymous sessions.

## Purchase testing

RevenueCat on Expo requires a development build for real purchases. Expo Go still works for UI and flow validation because `react-native-purchases` exposes Preview API Mode there.

Useful commands:

```bash
npm install
npm run typecheck
npx expo start
npx expo run:ios
eas build --platform ios --profile ios-simulator
```
