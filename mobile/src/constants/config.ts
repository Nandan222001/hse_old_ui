// localhost works everywhere provided the device can reach the host's port 8000:
//   - Android physical device: run `adb reverse tcp:8000 tcp:8000` (re-run after replug)
//   - Android emulator: `adb reverse` works there too; 10.0.2.2 is the alternative
//   - iOS simulator: shares the host's loopback already
// 10.0.2.2 is emulator-ONLY — on a physical device it is a dead address (Network Error).
// NOTE: bare React Native does not auto-load .env — edit the default here if needed.
// Pointed at the local backend for both build types while the app is being
// tested against a machine on the desk. A release APK is not __DEV__, so it
// used to take the production branch and a locally-installed build talked to
// api.ehsera.com — which is not what you want when you are checking a change
// you have not deployed yet.
//
// Restore the production release target by putting this back:
//   (__DEV__ ? 'http://localhost:8000/api/v1' : 'https://api.ehsera.com/api/v1')
//
// localhost needs `adb reverse tcp:8000 tcp:8000` on a physical device, re-run
// after every replug. The emulator is served by the same reverse.
export const API_BASE_URL =
  process.env.API_BASE_URL ?? 'http://localhost:8000/api/v1';


export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'sup_access_token',
  REFRESH_TOKEN: 'sup_refresh_token',
  USER: 'sup_user',
} as const;
