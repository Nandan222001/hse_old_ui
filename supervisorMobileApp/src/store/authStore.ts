import { create } from 'zustand';
import { authService } from '../services/authService';
import type { AuthState, LoginRequest } from '../types/auth.types';

interface AuthStore extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.login(data);
      set({
        user: res.user,
        accessToken: res.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.detail ?? 'Login failed',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const session = await authService.restoreSession();
      if (session) {
        set({ user: session.user, accessToken: session.token, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
