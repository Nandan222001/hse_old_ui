// Android emulator reaches the host machine via 10.0.2.2 (iOS simulator uses localhost).
// A physical device must use your machine's LAN IP, e.g. http://192.168.1.50:8000/api/v1.
// NOTE: bare React Native does not auto-load .env — edit the default here if needed.
export const API_BASE_URL =
  process.env.API_BASE_URL ?? 'http://10.0.2.2:8000/api/v1';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'sup_access_token',
  REFRESH_TOKEN: 'sup_refresh_token',
  USER: 'sup_user',
} as const;
