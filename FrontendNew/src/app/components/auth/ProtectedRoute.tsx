import { Navigate } from "react-router";
import { useLocation } from "react-router";
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
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Keep these props accepted for compatibility, but do not fallback to base URL.
  void requiredModule;
  void hideForOnboardingScoped;

  const setupRequired = Boolean(user?.onboardingSetupRequired && !user?.onboardingSetupCompleted);
  // Allow one landing on dashboard to show onboarding setup prompt after login.
  // All other pages remain gated until setup is completed.
  if (setupRequired && location.pathname !== "/users" && location.pathname !== "/") {
    return <Navigate to="/users" replace />;
  }

  return <>{children}</>;
}
