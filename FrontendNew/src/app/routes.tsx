import { createBrowserRouter, Navigate, useRouteError } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ViolationsPage } from "./pages/ViolationsPage";
import { ViolationDetailPage } from "./pages/ViolationDetailPage";
import { PoliciesPage } from "./pages/PoliciesPage";
import { SitesZonesPage } from "./pages/SitesZonesPage";
import { CamerasDevicesPage } from "./pages/CamerasDevicesPage";
import { UsersPage } from "./pages/UsersPage";
import { VendorsPage } from "./pages/VendorsPage";
import { ActionsPage } from "./pages/ActionsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AIAgentPage } from "./pages/AIAgentPage";
import { CompliancePage } from "./pages/CompliancePage";
import { ChecklistPage } from "./pages/ChecklistPage";
import { BillingPage } from "./pages/BillingPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { NearMissPage } from "./pages/NearMissPage";
import { RiskPage } from "./pages/RiskPage";
import { AssetsPage } from "./pages/AssetsPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import type { ComponentType } from "react";

function RouteErrorFallback() {
  const error = useRouteError() as { message?: string; statusText?: string } | undefined;
  const detail = error?.message || error?.statusText || "Unexpected route error";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#F3F7FF",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          background: "#fff",
          border: "1px solid #D6E4FF",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 8px", color: "#0A0A0A" }}>Page failed to load</h2>
        <p style={{ margin: "0 0 12px", color: "#374151" }}>An unexpected app error occurred.</p>
        <p style={{ margin: "0 0 16px", color: "#6B7280", fontSize: 13 }}>Details: {detail}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: "linear-gradient(135deg, #0B3D91, #1D4ED8)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    </div>
  );
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

const DashboardRoute = DashboardPage;
const ViolationsRoute = ViolationsPage;
const ViolationDetailRoute = ViolationDetailPage;
const ActionsRoute = ActionsPage;
const ChecklistsRoute = ChecklistPage;
const ComplianceRoute = CompliancePage;
const SitesZonesRoute = SitesZonesPage;
const CamerasDevicesRoute = CamerasDevicesPage;
const AIAgentRoute = AIAgentPage;
const AnalyticsRoute = AnalyticsPage;
const NearMissRoute = NearMissPage;
const RootCauseAnalysisRoute = RiskPage;
const EquipmentCertificationRoute = AssetsPage;

function hiddenForOnboarding<T extends object>(Component: ComponentType<T>) {
  return function HiddenForOnboardingScopedRoute(props: T) {
    return (
      <ProtectedRoute hideForOnboardingScoped>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

const PoliciesRoute = hiddenForOnboarding(PoliciesPage);
const UsersRoute = UsersPage;
const VendorsRoute = VendorsPage;
const BillingRoute = hiddenForOnboarding(BillingPage);
const NotificationsRoute = NotificationsPage;
const EngagementRoute = NotificationsPage;
const SettingsRoute = hiddenForOnboarding(SettingsPage);
const SubscriptionRoute = hiddenForOnboarding(SubscriptionPage);

export const router = createBrowserRouter([
  {
    path: "/auth/login",
    Component: LoginPage,
    errorElement: <RouteErrorFallback />,
  },
  {
    path: "/auth/signup",
    Component: () => <Navigate to="/auth/login?mode=signup" replace />,
  },
  {
    path: "/auth/onboarding",
    Component: OnboardingPage,
  },
  {
    path: "/auth/onboarding/form",
    Component: OnboardingPage,
  },
  {
    path: "/auth/onboarding/admin",
    Component: OnboardingPage,
  },
  {
    path: "/auth/onboarding/tracker",
    Component: OnboardingPage,
  },
  {
    path: "/login",
    Component: () => <Navigate to="/auth/login" replace />,
  },
  {
    path: "/onboarding",
    Component: () => <Navigate to="/auth/onboarding" replace />,
  },
  {
    path: "/onboarding/form",
    Component: () => <Navigate to="/auth/onboarding/form" replace />,
  },
  {
    path: "/onboarding/admin",
    Component: () => <Navigate to="/auth/onboarding/admin" replace />,
  },
  {
    path: "/onboarding/tracker",
    Component: () => <Navigate to="/auth/onboarding/tracker" replace />,
  },
  {
    path: "/",
    Component: ProtectedLayout,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, Component: DashboardRoute },
      { path: "violations", Component: ViolationsRoute },
      { path: "violations/:id", Component: ViolationDetailRoute },
      { path: "actions", Component: ActionsRoute },
      { path: "checklists", Component: ChecklistsRoute },
      { path: "compliance", Component: ComplianceRoute },
      { path: "sites-zones", Component: SitesZonesRoute },
      { path: "cameras-devices", Component: CamerasDevicesRoute },
      { path: "policies", Component: PoliciesRoute },
      { path: "users", Component: UsersRoute },
      { path: "vendors", Component: VendorsRoute },
      { path: "analytics", Component: AnalyticsRoute },
      { path: "ai-agent", Component: AIAgentRoute },
      { path: "billing", Component: BillingRoute },
      { path: "notifications", Component: NotificationsRoute },
      { path: "engagement", Component: EngagementRoute },
      { path: "settings", Component: SettingsRoute },
      { path: "subscription", Component: SubscriptionRoute },
      { path: "near-miss", Component: NearMissRoute },
      { path: "root-cause-analysis", Component: RootCauseAnalysisRoute },
      { path: "equipment-certification", Component: EquipmentCertificationRoute },
    ],
  },
  {
    path: "*",
    Component: () => <Navigate to="/auth/login" replace />,
    errorElement: <RouteErrorFallback />,
  },
]);
