// Must stay in lockstep with src/constants/config.ts — the two clients split
// the app between them (login and the shared screens use that one, every worker
// screen uses this one), so a mismatch sends half the app to a different host.
//
// That is exactly what happened: the release target was restored in that file
// and not in this one, so a release APK authenticated against production and
// then asked localhost for the worker's KPIs. On a phone localhost is nothing,
// the request failed, and DashboardScreen's empty .catch turned it into a blank
// tile with no error. See that file for why this is localhost and not 10.0.2.2.
export const API_BASE_URL =
  process.env.API_BASE_URL ??
  (__DEV__ ? 'http://localhost:8000/api/v1' : 'https://api.ehsera.com/api/v1');

export const API_TIMEOUT = 15000;

// Single source of truth with the shared session store (src/constants/config.ts).
// The worker apiClient MUST read the same AsyncStorage entries that login writes,
// otherwise `/employees/me` authenticates with a stale token from a previous
// worker session and returns someone else's profile. Keeping these keys distinct
// (the old worker_* keys) required error-prone mirroring on every session change
// (login/changePassword/restoreSession) — sharing the keys removes that whole class of bug.
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'sup_access_token',
  REFRESH_TOKEN: 'sup_refresh_token',
  USER: 'sup_user',
} as const;

export const APP_CONFIG = {
  MAX_PHOTO_SIZE_MB: 10,
  MAX_ATTACHMENT_SIZE_MB: 5,
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png'],
  SUPPORTED_DOC_FORMATS: ['pdf', 'jpg', 'jpeg', 'png'],
} as const;
