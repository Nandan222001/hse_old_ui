import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { TokenStorage } from '../utils/storage';
import type { LoginRequest, LoginResponse, User, ChangePasswordRequest } from '../types/auth.types';

export const authService = {
  async login(data: LoginRequest, role: 'manager' | 'supervisor' | 'worker'): Promise<LoginResponse> {
    // 1. Manager Role: Local mock login
    if (role === 'manager') {
      const mockRes: LoginResponse = {
        access_token: 'mock-manager-token',
        refresh_token: 'mock-manager-refresh',
        user: {
          id: '1',
          employee_id: data.employee_id || '8842-TX',
          name: 'Sarah Mitchell',
          role: 'Manager',
          site: 'Houston Refinery • Terminal 4',
          department: 'HSE & Compliance'
        }
      };
      await TokenStorage.setTokens(mockRes.access_token, mockRes.refresh_token);
      await TokenStorage.setUser(mockRes.user);
      await TokenStorage.setSelectedRole(role);
      return mockRes;
    }

    // 2. Supervisor / Worker Roles: Try backend API, fall back to mock if network/server is offline
    const apiPayload = {
      username: data.employee_id,
      password: role === 'worker' ? (data.pin || data.password || 'password') : (data.password || 'password')
    };

    try {
      const res = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, apiPayload);
      const resData = res.data;
      
      // Ensure role property exists in user model
      if (resData.user) {
        if (!resData.user.role) {
          resData.user.role = role === 'supervisor' ? 'Supervisor' : 'Worker';
        }
      }

      await TokenStorage.setTokens(resData.access_token, resData.refresh_token);
      await TokenStorage.setUser(resData.user);
      await TokenStorage.setSelectedRole(role);
      return resData;
    } catch (err: any) {
      console.log('Login API failed, checking network/offline fallback:', err?.message || err);
      
      // If network error, offline, or server is down, we use developer mock fallbacks (only outside tests)
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error');
      if (isNetworkError && process.env.NODE_ENV !== 'test') {
        let mockRes: LoginResponse;
        if (role === 'supervisor') {
          mockRes = {
            access_token: 'mock-supervisor-token',
            refresh_token: 'mock-supervisor-refresh',
            user: {
              id: '2',
              employee_id: data.employee_id || 'ENG-0442-TX',
              name: 'Raj Sharma',
              role: 'Supervisor',
              site: 'Houston Refinery • Terminal 4',
              department: 'Production Floor'
            }
          };
        } else {
          mockRes = {
            access_token: 'mock-worker-token',
            refresh_token: 'mock-worker-refresh',
            user: {
              id: '3',
              employee_id: data.employee_id || '8842-TX',
              name: 'Tom Bradley',
              role: 'Worker',
              site: 'Houston Refinery • Terminal 4',
              department: 'Operations'
            }
          };
        }

        await TokenStorage.setTokens(mockRes.access_token, mockRes.refresh_token);
        await TokenStorage.setUser(mockRes.user);
        await TokenStorage.setSelectedRole(role);
        return mockRes;
      }
      // If it's a validation or credentials error (e.g. 401), rethrow it
      throw err;
    }
  },

  async changePassword(payload: ChangePasswordRequest): Promise<LoginResponse> {
    try {
      const res = await apiClient.post<any>(ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
      const resData = res.data;
      if (resData.access_token) {
        await TokenStorage.setTokens(resData.access_token, resData.refresh_token || '');
        if (resData.user) {
          await TokenStorage.setUser(resData.user);
        }
      }
      return resData;
    } catch (err) {
      // Fallback for mock/dev
      const mockRes: LoginResponse = {
        access_token: 'mock-token',
        refresh_token: '',
        user: {
          id: '3',
          employee_id: '8842-TX',
          name: 'Tom Bradley',
          role: 'Worker',
          site: 'Houston Refinery • Terminal 4',
          department: 'Operations'
        }
      };
      return mockRes;
    }
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
