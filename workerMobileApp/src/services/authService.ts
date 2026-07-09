import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { TokenStorage } from '../utils/storage';
import { ChangePasswordRequest, LoginRequest, LoginResponse, User } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, credentials);
    await TokenStorage.setTokens(data.access_token, data.refresh_token);
    await TokenStorage.setUser(data.user);
    return data;
  },

  async changePassword(payload: ChangePasswordRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
    // Backend returns fresh tokens after a successful change
    if (data?.access_token) {
      await TokenStorage.setTokens(data.access_token, data.refresh_token);
      await TokenStorage.setUser(data.user);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    } finally {
      await TokenStorage.clearAll();
    }
  },

  async getProfile(): Promise<User> {
    const { data } = await apiClient.get<User>(ENDPOINTS.AUTH.PROFILE);
    return data;
  },

  async restoreSession(): Promise<{ user: User; token: string } | null> {
    const [token, user] = await Promise.all([
      TokenStorage.getAccessToken(),
      TokenStorage.getUser(),
    ]);
    if (!token || !user) return null;
    return { user, token };
  },
};
