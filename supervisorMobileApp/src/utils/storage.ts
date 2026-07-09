import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS as KEYS } from '../constants/config';

export const TokenStorage = {
  async setTokens(access: string, refresh: string) {
    await AsyncStorage.multiSet([
      [KEYS.ACCESS_TOKEN, access ?? ''],
      [KEYS.REFRESH_TOKEN, refresh ?? ''],
    ]);
  },
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  },
  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
  },
  async clearAll() {
    await AsyncStorage.multiRemove([KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN, KEYS.USER]);
  },
  async setUser(user: object) {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  async getUser<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
};
