import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { TokenStorage } from '../utils/storage';
import type { LoginRequest, LoginResponse, User } from '../types/auth.types';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, data);
    const { access_token, refresh_token, user } = res.data;
    await TokenStorage.setTokens(access_token, refresh_token);
    await TokenStorage.setUser(user);
    return res.data;
  },

  async logout(): Promise<void> {
    try { await apiClient.post(ENDPOINTS.AUTH.LOGOUT); } catch {}
    await TokenStorage.clearAll();
  },

  async getProfile(): Promise<User> {
    const res = await apiClient.get<User>(ENDPOINTS.AUTH.PROFILE);
    return res.data;
  },

  async restoreSession(): Promise<{ user: User; token: string } | null> {
    const [token, user] = await Promise.all([
      TokenStorage.getAccessToken(),
      TokenStorage.getUser<User>(),
    ]);
    if (!token || !user) return null;
    return { user, token };
  },
};
