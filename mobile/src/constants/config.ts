// localhost works everywhere provided the device can reach the host's port 8000:
//   - Android physical device: run `adb reverse tcp:8000 tcp:8000` (re-run after replug)
//   - Android emulator: `adb reverse` works there too; 10.0.2.2 is the alternative
//   - iOS simulator: shares the host's loopback already
// 10.0.2.2 is emulator-ONLY — on a physical device it is a dead address (Network Error).
// NOTE: bare React Native does not auto-load .env — edit the default here if needed.
export const API_BASE_URL =
  process.env.API_BASE_URL ??
  (__DEV__ ? 'http://localhost:8000/api/v1' : 'https://api.ehsera.com/api/v1');


export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'sup_access_token',
  REFRESH_TOKEN: 'sup_refresh_token',
  USER: 'sup_user',
} as const;
