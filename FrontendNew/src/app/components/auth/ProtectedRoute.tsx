import { Navigate } from "react-router";
import { useLocation } from "react-router";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import type { ReactNode } from "react";
import type { UiModuleLabel } from "../../context/AuthContext";

export function ProtectedRoute({
  children,
  requiredModule,
  hideForOnboardingScoped,
}: {
  children: ReactNode;
  requiredModule?: UiModuleLabel;
  hideForOnboardingScoped?: boolean;
}) {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  // Web is admin-only (see AuthContext.login) — but a session created before that
  // gate existed, or restored from stale localStorage, can still carry a non-admin
  // role. Sign those out rather than leaving the full dashboard reachable.
  const isWebAllowedRole = Boolean(user?.isSuperAdmin) || user?.role === "Admin";
  useEffect(() => {
    if (isAuthenticated && !isWebAllowedRole) {
      logout();
    }
  }, [isAuthenticated, isWebAllowedRole, logout]);

  if (!isAuthenticated || !isWebAllowedRole) {
    return <Navigate to="/auth/login" replace />;
  }

  // Keep these props accepted for compatibility, but do not fallback to base URL.
  void requiredModule;
  void hideForOnboardingScoped;

  const setupRequired = Boolean(user?.onboardingSetupRequired && !user?.onboardingSetupCompleted);
  // Allow one landing on dashboard to show onboarding setup prompt after login.
  // All other pages remain gated until setup is completed.
  if (setupRequired && location.pathname !== "/org-setup-wizard") {
    return <Navigate to="/org-setup-wizard" replace />;
  }

  return <>{children}</>;
}
