// Debug build → local emulator; Release build → production Azure server.
export const API_BASE_URL =
  process.env.API_BASE_URL ??
  (__DEV__ ? 'http://10.0.2.2:8000/api/v1' : 'https://20.65.202.44/api/v1');

export const API_TIMEOUT = 15000;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'hse_driver_user',
} as const;

export const APP_CONFIG = {
  MAX_PHOTO_SIZE_MB: 10,
  MAX_ATTACHMENT_SIZE_MB: 5,
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png'],
  SUPPORTED_DOC_FORMATS: ['pdf', 'jpg', 'jpeg', 'png'],
} as const;
