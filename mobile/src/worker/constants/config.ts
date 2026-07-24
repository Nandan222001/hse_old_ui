// Debug build → local dev server; Release build → production Azure server.
// See src/constants/config.ts for why this is localhost and not 10.0.2.2:
// a physical device needs `adb reverse tcp:8000 tcp:8000`.
export const API_BASE_URL =
  process.env.API_BASE_URL ??
  (__DEV__ ? 'http://localhost:8000/api/v1' : 'https://20.65.202.44/api/v1');

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
