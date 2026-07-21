import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { ChangePasswordRequest, LoginRequest } from '../types';

export function useAuth() {
  const {
    user, isAuthenticated, isLoading, error, mustChangePassword,
    login, logout, changePassword, restoreSession, clearError,
  } = useAuthStore();

  const handleLogin = useCallback(async (credentials: LoginRequest) => {
    await login(credentials);
  }, [login]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleChangePassword = useCallback(async (payload: ChangePasswordRequest) => {
    await changePassword(payload);
  }, [changePassword]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    mustChangePassword,
    login: handleLogin,
    logout: handleLogout,
    changePassword: handleChangePassword,
    restoreSession,
    clearError,
  };
}
