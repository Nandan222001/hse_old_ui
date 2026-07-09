import { create } from 'zustand';
import { authService } from '../services/authService';
import { User, LoginRequest, ChangePasswordRequest } from '../types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mustChangePassword: boolean;

  login: (credentials: LoginRequest) => Promise<void>;
  changePassword: (payload: ChangePasswordRequest) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  mustChangePassword: false,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.login(credentials);
      set({
        user: res.user,
        accessToken: res.access_token,
        isAuthenticated: true,
        mustChangePassword: !!res.must_change_password,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.detail || 'Invalid credentials. Please try again.',
      });
      throw err;
    }
  },

  changePassword: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.changePassword(payload);
      set({
        user: res.user ?? undefined,
        accessToken: res.access_token ?? undefined,
        isAuthenticated: true,
        mustChangePassword: false,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.detail || 'Could not change password. Please try again.',
      });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      set({ user: null, accessToken: null, isAuthenticated: false, mustChangePassword: false, isLoading: false });
    }
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
