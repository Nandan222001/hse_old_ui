import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const store = useAuthStore();
  const login = useCallback(store.login, []);
  const logout = useCallback(store.logout, []);
  const restoreSession = useCallback(store.restoreSession, []);
  return { ...store, login, logout, restoreSession };
}
