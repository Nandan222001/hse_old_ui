import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const store = useAuthStore();
  const login = useCallback(store.login, []);
  const logout = useCallback(store.logout, []);
  const restoreSession = useCallback(store.restoreSession, []);
  const setSelectedRole = useCallback(store.setSelectedRole, []);
  return { ...store, login, logout, restoreSession, setSelectedRole };
}
