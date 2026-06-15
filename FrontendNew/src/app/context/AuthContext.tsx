import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { auth, googleProvider, db } from "../../config/firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, fetchSignInMethodsForEmail, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getOnboardingAccessProfile } from "../../services/onboarding.service";
import { loginWithThetaCredentials, loginWithHSEBackend } from "../../services/auth.service";
import { checkOrgSetupRequired } from "../../services/organisation-setup.service";

export type LoginResult =
  | "success"
  | "org_setup_required"
  | "invalid_credentials"
  | "user_not_found"
  | "password_setup_required"
  | "pending_approval"
  | "access_denied"
  | "network_error"
  | "error";

const ADMIN_EMAIL = import.meta.env.VITE_DEV_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = import.meta.env.VITE_DEV_ADMIN_PASSWORD ?? "";
const SUPER_ADMIN_EMAIL = import.meta.env.VITE_DEV_SUPER_ADMIN_EMAIL ?? "";
const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_DEV_SUPER_ADMIN_PASSWORD ?? "";
const SUPER_ADMIN_PASSWORD_ALT = import.meta.env.VITE_DEV_SUPER_ADMIN_PASSWORD_ALT ?? "";
const INSPECTOR_EMAIL = import.meta.env.VITE_DEV_INSPECTOR_EMAIL ?? "";
const INSPECTOR_PASSWORD = import.meta.env.VITE_DEV_INSPECTOR_PASSWORD ?? "";
const ENGINEER_EMAIL = import.meta.env.VITE_DEV_ENGINEER_EMAIL ?? "";
const ENGINEER_PASSWORD = import.meta.env.VITE_DEV_ENGINEER_PASSWORD ?? "";
const WORKER_EMAIL = import.meta.env.VITE_DEV_WORKER_EMAIL ?? "";
const WORKER_PASSWORD = import.meta.env.VITE_DEV_WORKER_PASSWORD ?? "";
const ENABLE_DEV_TEST_ACCOUNTS = import.meta.env.DEV && String(import.meta.env.VITE_ENABLE_DEV_TEST_ACCOUNTS ?? "false").toLowerCase() === "true";
const PRODUCT_ADMIN_EMAILS = new Set(
  String(import.meta.env.VITE_PRODUCT_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);
const ENABLE_DEV_PRODUCT_ADMIN_FALLBACK = import.meta.env.DEV && String(import.meta.env.VITE_ENABLE_DEV_PRODUCT_ADMIN_FALLBACK ?? "true").toLowerCase() === "true";
const ENABLE_PROD_SUPERADMIN_HARDCODED_LOGIN = !import.meta.env.DEV && String(import.meta.env.VITE_ENABLE_PROD_SUPERADMIN_HARDCODED_LOGIN ?? "false").toLowerCase() === "true";

// ─────────────────────────────────────────────────────────────────────────────
// ROLE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All user roles supported in the HSE platform.
 *
 * - Admin          : Full system access — all KPIs, all pages, all actions.
 * - HSE Manager    : Full operational + compliance access across all sites.
 * - Safety Manager : Violations, actions, workers, zones, contractors per site.
 * - Supervisor     : Day-to-day operational KPIs for their assigned site/shift.
 * - Auditor        : Read-only access to compliance, violations summary & audit trail.
 * - Site Inspector : Custom role mapped to Supervisor.
 * - Site Engineer  : Custom role mapped to Safety Manager.
 * - Worker         : Custom role mapped to Auditor.
 * - Contractor     : External workforce role mapped to Auditor-level visibility.
 */
export type UserRole = "Admin" | "HSE Manager" | "Safety Manager" | "Supervisor" | "Auditor" | "Site Inspector" | "Site Engineer" | "Worker" | "Contractor";

export type UiModuleLabel =
  | "Dashboard"
  | "Violations"
  | "Actions & SLA"
  | "Checklists"
  | "Compliance"
  | "Sites & Zones"
  | "Cameras & Devices"
  | "Near Miss"
  | "Root Cause Analysis"
  | "Equipment Certification"
  | "AI Agent";

const ALL_MODULE_LABELS: UiModuleLabel[] = [
  "Dashboard",
  "Violations",
  "Actions & SLA",
  "Checklists",
  "Compliance",
  "Sites & Zones",
  "Cameras & Devices",
  "Near Miss",
  "Root Cause Analysis",
  "Equipment Certification",
  "AI Agent",
];

const ONBOARDING_MODULE_ALIASES: Record<string, UiModuleLabel> = {
  dashboard: "Dashboard",
  violations: "Violations",
  "actions & sla": "Actions & SLA",
  actions: "Actions & SLA",
  checklists: "Checklists",
  compliance: "Compliance",
  "sites & zones": "Sites & Zones",
  "sites and zones": "Sites & Zones",
  "cameras & devices": "Cameras & Devices",
  "near miss": "Near Miss",
  "root cause analysis": "Root Cause Analysis",
  "equipment certification": "Equipment Certification",
  "ai agent": "AI Agent",
  "access intelligence": "AI Agent",
  "ai functionality": "AI Agent",
  chatbot: "AI Agent",
  "ai agent & chat interface": "AI Agent",
};

function normalizeModuleLabel(raw: string): UiModuleLabel | null {
  const key = raw.trim().toLowerCase();
  return ONBOARDING_MODULE_ALIASES[key] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type KPICategory =
  | "Dashboard"
  | "Violations"
  | "Actions & SLA"
  | "Workers & Access"
  | "Sites & Zones"
  | "Contractors"
  | "Devices & Infrastructure"
  | "Compliance";

export interface KPI {
  /** Unique identifier used in code to check access */
  id: string;
  /** Human-readable label shown on KPI cards */
  label: string;
  /** Grouping category */
  category: KPICategory;
  /** Page(s) where this KPI is rendered */
  pages: string[];
  /** Backend API endpoint or data source field that feeds this KPI */
  dataSource: string;
  /** API field / computation description */
  computation: string;
  /** Roles allowed to view this KPI */
  allowedRoles: UserRole[];
  /** Whether this KPI is already implemented in the UI */
  implemented: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI REGISTRY  — Single source of truth for every KPI in the platform
// ─────────────────────────────────────────────────────────────────────────────

export const KPI_REGISTRY: KPI[] = [
  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  {
    id: "total_violations_today",
    label: "Total Violations Today",
    category: "Dashboard",
    pages: ["Dashboard"],
    dataSource: "/api/dashboard/stats",
    computation: "DashboardStats.total_violations_today",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: true,
  },
  {
    id: "compliance_rate",
    label: "Compliance Rate",
    category: "Dashboard",
    pages: ["Dashboard"],
    dataSource: "/api/dashboard/stats",
    computation: "DashboardStats.compliance_rate — % workers PPE-compliant",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor", "Auditor"],
    implemented: true,
  },
  {
    id: "open_actions",
    label: "Open Actions",
    category: "Dashboard",
    pages: ["Dashboard"],
    dataSource: "/api/dashboard/stats",
    computation: "DashboardStats.open_actions — count of Actions where Status != 'Closed'",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: true,
  },
  {
    id: "avg_response_time",
    label: "Avg Response Time",
    category: "Dashboard",
    pages: ["Dashboard"],
    dataSource: "/api/dashboard/stats",
    computation: "DashboardStats.avg_response_time — mean time from Detected_At to first action",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager"],
    implemented: true,
  },
  {
    id: "workers_on_site",
    label: "Workers on Site",
    category: "Dashboard",
    pages: ["Dashboard"],
    dataSource: "/api/dashboard/stats",
    computation: "DashboardStats.workers_on_site — count of Workers with Status = 'Active'",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: true,
  },

  // ── VIOLATIONS ─────────────────────────────────────────────────────────────
  {
    id: "violations_by_severity",
    label: "Violations by Severity",
    category: "Violations",
    pages: ["Dashboard", "Violations", "Analytics"],
    dataSource: "/api/violations",
    computation: "Group Violations by Severity (Critical | High | Medium | Low) — count per bucket",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor", "Auditor"],
    implemented: false,
  },
  {
    id: "violations_by_shift",
    label: "Violations by Shift",
    category: "Violations",
    pages: ["Dashboard", "Analytics"],
    dataSource: "/api/violations",
    computation: "Group Violations by Shift field — count per shift",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: false,
  },
  {
    id: "violations_by_zone",
    label: "Violations by Zone",
    category: "Violations",
    pages: ["Violations", "Analytics", "Sites & Zones"],
    dataSource: "/api/violations",
    computation: "Group Violations by Zone_ID — count per zone",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: false,
  },
  {
    id: "violations_by_ppe_type",
    label: "Violations by PPE Type",
    category: "Violations",
    pages: ["Violations", "Analytics"],
    dataSource: "/api/violations",
    computation: "Group Violations by PPE_Missing — count per PPE type",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor", "Auditor"],
    implemented: false,
  },
  {
    id: "false_positive_rate",
    label: "False Positive Rate",
    category: "Violations",
    pages: ["Violations", "Analytics"],
    dataSource: "/api/violations",
    computation: "count(Status = 'False Positive') / total violations × 100",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager"],
    implemented: false,
  },
  {
    id: "avg_confidence_score",
    label: "Avg AI Confidence Score",
    category: "Violations",
    pages: ["Violations", "Analytics"],
    dataSource: "/api/violations",
    computation: "mean(Violations.Confidence_Score)",
    allowedRoles: ["Admin", "HSE Manager"],
    implemented: false,
  },
  {
    id: "violation_acknowledgement_rate",
    label: "Violation Acknowledgement Rate",
    category: "Violations",
    pages: ["Violations", "Analytics"],
    dataSource: "/api/violations",
    computation: "count(Status != 'Open') / total violations × 100",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: false,
  },

  // ── ACTIONS & SLA ──────────────────────────────────────────────────────────
  {
    id: "total_open_actions",
    label: "Total Open Actions",
    category: "Actions & SLA",
    pages: ["Actions"],
    dataSource: "/api/actions",
    computation: "count(Actions.Status = 'Open')",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: true,
  },
  {
    id: "overdue_actions",
    label: "Overdue Actions",
    category: "Actions & SLA",
    pages: ["Actions"],
    dataSource: "/api/actions",
    computation: "count(Status != 'Closed' AND Due_Date < today)",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: true,
  },
  {
    id: "due_today_actions",
    label: "Due Today",
    category: "Actions & SLA",
    pages: ["Actions"],
    dataSource: "/api/actions",
    computation: "count(Status != 'Closed' AND Due_Date = today)",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: true,
  },
  {
    id: "closed_this_month_actions",
    label: "Closed This Month",
    category: "Actions & SLA",
    pages: ["Actions"],
    dataSource: "/api/actions",
    computation: "count(Status = 'Closed' AND Completed_At within current month)",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: true,
  },
  {
    id: "sla_breach_rate",
    label: "SLA Breach Rate",
    category: "Actions & SLA",
    pages: ["Actions", "Analytics"],
    dataSource: "/api/actions + /api/sla-config",
    computation: "count(actions exceeding SLA.Resolution_Time_Hours per severity) / total × 100",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager"],
    implemented: false,
  },
  {
    id: "avg_resolution_time_by_severity",
    label: "Avg Resolution Time by Severity",
    category: "Actions & SLA",
    pages: ["Actions", "Analytics"],
    dataSource: "/api/actions",
    computation: "mean(Completed_At - Created_At) grouped by Actions.Priority",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager"],
    implemented: false,
  },
  {
    id: "action_completion_rate",
    label: "Action Completion Rate",
    category: "Actions & SLA",
    pages: ["Actions", "Analytics"],
    dataSource: "/api/actions",
    computation: "count(Status = 'Closed') / total actions × 100",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: false,
  },

  // ── WORKERS & ACCESS ───────────────────────────────────────────────────────
  {
    id: "gate_access_denial_rate",
    label: "Gate Access Denial Rate",
    category: "Workers & Access",
    pages: ["Sites & Zones", "Analytics"],
    dataSource: "/api/access-log",
    computation: "count(Result = 'Denied') / total access events × 100",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: false,
  },
  {
    id: "rfid_reads_today",
    label: "RFID Reads Today",
    category: "Workers & Access",
    pages: ["Cameras & Devices"],
    dataSource: "/api/rfid-readers",
    computation: "sum(RFIDReaders.Total_Reads_Today)",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager"],
    implemented: false,
  },
  {
    id: "active_workers_per_shift",
    label: "Active Workers per Shift",
    category: "Workers & Access",
    pages: ["Dashboard", "Analytics"],
    dataSource: "/api/workers",
    computation: "count(Workers.Status = 'Active') grouped by Workers.Shift",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: false,
  },

  // ── SITES & ZONES ──────────────────────────────────────────────────────────
  {
    id: "site_compliance_rate",
    label: "Site Compliance Rate",
    category: "Sites & Zones",
    pages: ["Dashboard", "Sites & Zones", "Analytics"],
    dataSource: "/api/sites",
    computation: "Sites.Compliance_Rate per site",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor", "Auditor"],
    implemented: false,
  },
  {
    id: "high_risk_zone_count",
    label: "High-Risk Zone Count",
    category: "Sites & Zones",
    pages: ["Dashboard", "Sites & Zones"],
    dataSource: "/api/zones",
    computation: "count(Zones.Risk_Score > 70)",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: false,
  },
  {
    id: "avg_zone_risk_score",
    label: "Avg Zone Risk Score",
    category: "Sites & Zones",
    pages: ["Sites & Zones", "Analytics"],
    dataSource: "/api/zones",
    computation: "mean(Zones.Risk_Score)",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: false,
  },

  // ── CONTRACTORS ────────────────────────────────────────────────────────────
  {
    id: "contractor_safety_score",
    label: "Contractor Safety Score",
    category: "Contractors",
    pages: ["Dashboard", "Analytics"],
    dataSource: "/api/contractors",
    computation: "Contractors.Safety_Score per contractor",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager"],
    implemented: false,
  },
  {
    id: "violations_per_contractor",
    label: "Violations per Contractor",
    category: "Contractors",
    pages: ["Analytics", "Violations"],
    dataSource: "/api/violations + /api/workers",
    computation: "Join Violations.Worker_ID → Workers.Contractor, count per contractor",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager"],
    implemented: false,
  },
  {
    id: "workers_per_contractor",
    label: "Workers per Contractor",
    category: "Contractors",
    pages: ["Analytics"],
    dataSource: "/api/contractors",
    computation: "Contractors.Total_Workers per contractor",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Supervisor"],
    implemented: false,
  },

  // ── DEVICES & INFRASTRUCTURE ───────────────────────────────────────────────
  {
    id: "camera_online_rate",
    label: "Camera Online Rate",
    category: "Devices & Infrastructure",
    pages: ["Cameras & Devices"],
    dataSource: "/api/cameras",
    computation: "count(Cameras.Status = 'Active') / total cameras × 100",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager"],
    implemented: false,
  },
  {
    id: "edge_device_cpu_usage",
    label: "Edge Device CPU Usage",
    category: "Devices & Infrastructure",
    pages: ["Cameras & Devices"],
    dataSource: "/api/edge-devices",
    computation: "mean(EdgeDevices.CPU_Usage) across Online devices",
    allowedRoles: ["Admin", "HSE Manager"],
    implemented: false,
  },
  {
    id: "edge_device_gpu_usage",
    label: "Edge Device GPU Usage",
    category: "Devices & Infrastructure",
    pages: ["Cameras & Devices"],
    dataSource: "/api/edge-devices",
    computation: "mean(EdgeDevices.GPU_Usage) across Online devices",
    allowedRoles: ["Admin", "HSE Manager"],
    implemented: false,
  },
  {
    id: "edge_device_memory_usage",
    label: "Edge Device Memory Usage",
    category: "Devices & Infrastructure",
    pages: ["Cameras & Devices"],
    dataSource: "/api/edge-devices",
    computation: "mean(EdgeDevices.Memory_Usage) across Online devices",
    allowedRoles: ["Admin", "HSE Manager"],
    implemented: false,
  },
  {
    id: "rfid_reader_uptime",
    label: "RFID Reader Uptime",
    category: "Devices & Infrastructure",
    pages: ["Cameras & Devices"],
    dataSource: "/api/rfid-readers",
    computation: "count(RFIDReaders.Status = 'Active') / total RFID readers × 100",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager"],
    implemented: false,
  },

  // ── COMPLIANCE ─────────────────────────────────────────────────────────────
  {
    id: "per_standard_compliance_rate",
    label: "Per-Standard Compliance Rate",
    category: "Compliance",
    pages: ["Compliance"],
    dataSource: "/api/compliance-standards",
    computation: "ComplianceStandards.Compliance_Rate per standard",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Auditor"],
    implemented: false,
  },
  {
    id: "days_until_next_audit",
    label: "Days Until Next Audit",
    category: "Compliance",
    pages: ["Compliance"],
    dataSource: "/api/compliance-standards",
    computation: "min(ComplianceStandards.Next_Audit_Date) - today",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Auditor"],
    implemented: false,
  },
  {
    id: "standards_needing_review",
    label: "Standards Needing Review",
    category: "Compliance",
    pages: ["Compliance"],
    dataSource: "/api/compliance-standards",
    computation: "count(ComplianceStandards.Status = 'Needs Review')",
    allowedRoles: ["Admin", "HSE Manager", "Safety Manager", "Auditor"],
    implemented: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ROLE → KPI ACCESS MAP  (derived from registry, kept here as quick lookup)
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_KPI_MAP: Record<UserRole, string[]> = {
  Admin: KPI_REGISTRY.map((k) => k.id),
  "HSE Manager": KPI_REGISTRY.filter((k) => k.allowedRoles.includes("HSE Manager")).map((k) => k.id),
  "Safety Manager": KPI_REGISTRY.filter((k) => k.allowedRoles.includes("Safety Manager")).map((k) => k.id),
  Supervisor: KPI_REGISTRY.filter((k) => k.allowedRoles.includes("Supervisor")).map((k) => k.id),
  Auditor: KPI_REGISTRY.filter((k) => k.allowedRoles.includes("Auditor")).map((k) => k.id),
  "Site Inspector": KPI_REGISTRY.filter((k) => k.allowedRoles.includes("Supervisor")).map((k) => k.id),
  "Site Engineer": KPI_REGISTRY.filter((k) => k.allowedRoles.includes("Safety Manager")).map((k) => k.id),
  "Worker": KPI_REGISTRY.filter((k) => k.allowedRoles.includes("Auditor")).map((k) => k.id),
  "Contractor": KPI_REGISTRY.filter((k) => k.allowedRoles.includes("Auditor")).map((k) => k.id),
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — get KPI objects accessible to a given role
// ─────────────────────────────────────────────────────────────────────────────

export function getKPIsForRole(role: UserRole): KPI[] {
  return KPI_REGISTRY.filter((k) => k.allowedRoles.includes(role));
}

export function getKPIById(id: string): KPI | undefined {
  return KPI_REGISTRY.find((k) => k.id === id);
}

export function hasKPIAccess(role: UserRole, kpiId: string): boolean {
  return ROLE_KPI_MAP[role]?.includes(kpiId) ?? false;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  isSuperAdmin?: boolean;
  orgCode?: string;
  companyName?: string;
  allowedModules?: UiModuleLabel[];
  onboardingScoped?: boolean;
  onboardingSetupRequired?: boolean;
  onboardingSetupCompleted?: boolean;
  onboardingMaxUsers?: number;
  onboardingConfiguredUsers?: number;
}

export type SubscriptionPlan = "Free" | "Pro" | "Enterprise";

function normalizeSubscriptionPlan(value: unknown): SubscriptionPlan | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "free" || raw.includes("free")) return "Free";
  if (raw === "pro" || raw.includes("pro")) return "Pro";
  if (raw === "enterprise" || raw.includes("enterprise")) return "Enterprise";
  return null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  /** All KPI objects the current user is allowed to view */
  accessibleKPIs: KPI[];
  /** Check at runtime whether this user can see a specific KPI by id */
  canViewKPI: (kpiId: string) => boolean;
  canAccessModuleLabel: (label: UiModuleLabel) => boolean;
  isOnboardingScopedUser: boolean;
  login: (email: string, password: string, orgCode?: string) => Promise<LoginResult>;
  signup: (email: string, password: string) => Promise<LoginResult>;
  loginWithGoogle: () => Promise<LoginResult>;
  logout: () => void;
  markOnboardingSetupCompleted: () => void;
  subscriptionPlan: SubscriptionPlan;
  setSubscriptionPlan: (plan: SubscriptionPlan) => void;
}

const defaultAuthContextValue: AuthContextType = {
  isAuthenticated: false,
  user: null,
  accessibleKPIs: [],
  canViewKPI: () => false,
  canAccessModuleLabel: () => false,
  isOnboardingScopedUser: false,
  login: async () => "error",
  signup: async () => "error",
  loginWithGoogle: async () => "error",
  logout: () => {},
  markOnboardingSetupCompleted: () => {},
  subscriptionPlan: "Free",
  setSubscriptionPlan: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

type AccessResolution = "approved" | "pending" | "denied";

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("hse_auth") === "true";
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("hse_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>(() => {
    return normalizeSubscriptionPlan(localStorage.getItem("hse_subscription")) ?? "Free";
  });

  const clearLocalAuthState = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("hse_auth");
    localStorage.removeItem("hse_user");
  }, []);

  const currentUserAllowedModules = useMemo<UiModuleLabel[]>(() => {
    if (!user) return [];
    if (user.allowedModules && user.allowedModules.length > 0) {
      return user.allowedModules;
    }
    return ALL_MODULE_LABELS;
  }, [user]);

  // Derive accessible KPIs whenever user / role changes — memoised for perf
  const accessibleKPIs = useMemo<KPI[]>(() => {
    if (!user) return [];
    return getKPIsForRole(user.role);
  }, [user]);

  const canViewKPI = (kpiId: string): boolean => {
    if (!user) return false;
    return hasKPIAccess(user.role, kpiId);
  };

  const canAccessModuleLabel = (label: UiModuleLabel): boolean => {
    if (!user) return false;
    if (label === "AI Agent") {
      // Legacy / non-onboarding users don't carry onboarding plan metadata.
      // Keep AI available for them to avoid false Free-plan locks.
      if (!user.onboardingScoped) {
        return true;
      }

      // Accept explicit module entitlements even if plan sync is temporarily stale.
      const hasExplicitAiModule = currentUserAllowedModules.includes("AI Agent");
      return hasExplicitAiModule || subscriptionPlan !== "Free";
    }
    return currentUserAllowedModules.includes(label);
  };

  const isOnboardingScopedUser = Boolean(user?.onboardingScoped);

  const mapOnboardingRoleToUserRole = (rawRole: string | undefined): UserRole => {
    const normalized = (rawRole || "").trim().toLowerCase();
    if (normalized === "admin") return "Admin";
    if (normalized === "site engineer") return "Site Engineer";
    if (normalized === "site inspector") return "Site Inspector";
    if (normalized === "worker/contractor") return "Contractor";
    return "Auditor";
  };

  const isWebAllowedOnboardingRole = (role: UserRole): boolean => role === "Admin";

  const resolveFirestoreUser = useCallback(async (firebaseUser: FirebaseUser, orgCodeHint?: string): Promise<AccessResolution> => {
    const normalizedEmail = firebaseUser.email?.toLowerCase() ?? "";
    const isDevAdmin = ENABLE_DEV_TEST_ACCOUNTS && normalizedEmail === ADMIN_EMAIL;
    const isProductAdmin = PRODUCT_ADMIN_EMAILS.has(normalizedEmail);
    const isPrivilegedAdmin = isDevAdmin || isProductAdmin;
    try {
      const email = normalizedEmail;

      // Onboarding-driven approval + module access profile for org admins.
      if (email && !isPrivilegedAdmin) {
        try {
          const profile = await getOnboardingAccessProfile(email, orgCodeHint);
          if (profile.found && profile.approved) {
            const resolvedRole = mapOnboardingRoleToUserRole(profile.user_role);
            if (!isWebAllowedOnboardingRole(resolvedRole)) {
              clearLocalAuthState();
              await signOut(auth);
              return "denied";
            }

            const mappedModules = (profile.selected_modules ?? [])
              .map((m) => normalizeModuleLabel(m))
              .filter((m): m is UiModuleLabel => Boolean(m));

            const profileName = profile.user_name || profile.display_name || profile.worker_name || profile.admin_name;
            const name = firebaseUser.displayName || profileName || "Org Admin";
            const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            const userData: AuthUser = {
              name,
              email,
              role: resolvedRole,
              initials,
              orgCode: profile.org_code,
              companyName: profile.company_name,
              allowedModules: mappedModules.length > 0 ? mappedModules : ALL_MODULE_LABELS,
              onboardingScoped: true,
              onboardingSetupRequired: Boolean(profile.setup_required),
              onboardingSetupCompleted: Boolean(profile.setup_completed),
              onboardingMaxUsers: Number(profile.active_workers ?? 0),
              onboardingConfiguredUsers: Number(profile.configured_users_count ?? 0),
            };
            const normalizedPlan = normalizeSubscriptionPlan(profile.subscription_plan);
            if (normalizedPlan) {
              setSubscriptionPlan(normalizedPlan);
            }
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem("hse_auth", "true");
            localStorage.setItem("hse_user", JSON.stringify(userData));
            return "approved";
          }

          if (profile.found && !profile.approved) {
            const approvalState = String(profile.approval_state ?? profile.status ?? "").toLowerCase();
            clearLocalAuthState();
            await signOut(auth);
            return approvalState === "archived" ? "denied" : "pending";
          }
        } catch (profileErr) {
          console.warn("Onboarding access profile lookup failed, falling back to Firestore approval:", profileErr);
        }
      }

      const ref = doc(db, "app_users", firebaseUser.uid);
      const snap = await getDoc(ref);

      if (!snap.exists() || (!snap.data().approved && !isPrivilegedAdmin)) {
        await setDoc(ref, {
          email: firebaseUser.email ?? "",
          displayName: isPrivilegedAdmin ? "Product Admin" : (firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "User"),
          photoURL: firebaseUser.photoURL ?? null,
          role: isPrivilegedAdmin ? "Admin" : null,
          approved: isPrivilegedAdmin,
          createdAt: snap.exists() ? (snap.data().createdAt ?? serverTimestamp()) : serverTimestamp(),
        }, { merge: true });

        if (!isPrivilegedAdmin) {
          clearLocalAuthState();
          await signOut(auth);
          return "pending";
        }
      }

      const data = (await getDoc(ref)).data()!;
      const name = isPrivilegedAdmin ? "Product Admin" : (firebaseUser.displayName || data.displayName || "User");
      const resolvedEmail = firebaseUser.email || "";
      const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
      const role = isPrivilegedAdmin ? ("Admin" as UserRole) : ((data.role as UserRole) ?? "Auditor");
      const userData: AuthUser = { name, email: resolvedEmail, role, initials };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("hse_auth", "true");
      localStorage.setItem("hse_user", JSON.stringify(userData));
      return "approved";
    } catch (err) {
      console.error("Firestore user check failed:", err);
      if (!isPrivilegedAdmin) {
        clearLocalAuthState();
        await signOut(auth);
      }
      return "denied";
    }
  }, [clearLocalAuthState]);

  useEffect(() => {
    if (localStorage.getItem("hse_auth") !== "true") {
      setIsAuthenticated(false);
      setUser(null);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        await resolveFirestoreUser(firebaseUser, user?.orgCode);
      } else {
        const hasLocalThetaSession =
          localStorage.getItem("hse_auth") === "true"
          && Boolean(localStorage.getItem("hse_user"));
        if (hasLocalThetaSession) {
          return;
        }
        clearLocalAuthState();
      }
    });

    return () => unsubscribe();
  }, [clearLocalAuthState, resolveFirestoreUser, user?.orgCode]);

  useEffect(() => {
    localStorage.setItem("hse_auth", String(isAuthenticated));
    if (user) {
      localStorage.setItem("hse_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("hse_user");
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    localStorage.setItem("hse_subscription", subscriptionPlan);
  }, [subscriptionPlan]);

  useEffect(() => {
    if (!isAuthenticated || !user?.email || !user?.onboardingScoped) return;

    let cancelled = false;
    const refreshPlan = async () => {
      try {
        const profile = await getOnboardingAccessProfile(user.email, user.orgCode);
        const normalizedPlan = normalizeSubscriptionPlan(profile?.subscription_plan);
        if (!cancelled && normalizedPlan && normalizedPlan !== subscriptionPlan) {
          setSubscriptionPlan(normalizedPlan);
        }
      } catch (error) {
        console.warn("Unable to refresh onboarding subscription plan:", error);
      }
    };

    refreshPlan();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.email, user?.orgCode, user?.onboardingScoped, subscriptionPlan]);

  const login = async (email: string, password: string, orgCode?: string): Promise<LoginResult> => {
    const trimmedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    // ── HSE Backend JWT login (try first) ──────────────────────────────────
    try {
      const data = await loginWithHSEBackend(trimmedEmail, normalizedPassword);
      if (data?.access_token) {
        localStorage.setItem('hse_jwt_token', data.access_token);

        // Map backend role name to frontend UserRole
        const backendRole = (data.user.role ?? '').toLowerCase();
        let mappedRole: UserRole;
        if (backendRole === 'superadmin' || backendRole === 'admin') {
          mappedRole = 'Admin';
        } else if (backendRole === 'safety_manager') {
          mappedRole = 'Safety Manager';
        } else if (backendRole === 'supervisor') {
          mappedRole = 'Supervisor';
        } else {
          mappedRole = 'Auditor';
        }

        const userData: AuthUser = {
          name: data.user.username,
          email: data.user.email,
          role: mappedRole,
          initials: data.user.username.slice(0, 2).toUpperCase(),
          allowedModules: ALL_MODULE_LABELS,
          isSuperAdmin: backendRole === 'superadmin',
        };

        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('hse_auth', 'true');
        localStorage.setItem('hse_user', JSON.stringify(userData));

        // Check if this email has a pending org invite → needs data setup
        try {
          const setupCheck = await checkOrgSetupRequired(trimmedEmail);
          if (setupCheck.needs_setup) {
            // Store org name so the setup page can display it
            const enriched = { ...userData, orgName: setupCheck.organisation_name };
            localStorage.setItem('hse_user', JSON.stringify(enriched));
            return 'org_setup_required';
          }
        } catch {
          // Setup check failed silently; let the user proceed to dashboard
        }

        return 'success';
      }
    } catch (hseErr) {
      // HSE backend unavailable or returned 401 — fall through to Firebase/Theta auth
      console.warn('HSE backend login unavailable, falling back to Firebase/Theta auth:', hseErr);
    }

    // Optional production fallback for the legacy hardcoded superadmin account.
    // Keep disabled by default and enable only via explicit environment flag.
    if (
      ENABLE_PROD_SUPERADMIN_HARDCODED_LOGIN
      && trimmedEmail === SUPER_ADMIN_EMAIL
      && (normalizedPassword === SUPER_ADMIN_PASSWORD || normalizedPassword === SUPER_ADMIN_PASSWORD_ALT)
    ) {
      const userData: AuthUser = {
        name: "Theta HSE Super Admin",
        email: SUPER_ADMIN_EMAIL,
        role: "Admin",
        initials: "SA",
        allowedModules: ALL_MODULE_LABELS,
      };
      setUser(userData);
      setIsAuthenticated(true);
      return "success";
    }

    // Emergency unblock for product admin during local/dev testing.
    // This preserves testing flow even if Firebase password state is inconsistent.
    if (ENABLE_DEV_PRODUCT_ADMIN_FALLBACK && PRODUCT_ADMIN_EMAILS.has(trimmedEmail) && normalizedPassword.length > 0) {
      const userData: AuthUser = {
        name: "Product Admin",
        email: trimmedEmail,
        role: "Admin",
        initials: "PA",
        allowedModules: ALL_MODULE_LABELS,
      };
      setUser(userData);
      setIsAuthenticated(true);
      return "success";
    }

    // Handle hardcoded mock accounts
    if (ENABLE_DEV_TEST_ACCOUNTS) {
      if (trimmedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const userData: AuthUser = { name: "HSE Admin", email: ADMIN_EMAIL, role: "Admin", initials: "AD", allowedModules: ALL_MODULE_LABELS };
        setUser(userData);
        setIsAuthenticated(true);
        return "success";
      }
      if (
        trimmedEmail === SUPER_ADMIN_EMAIL
        && (normalizedPassword === SUPER_ADMIN_PASSWORD || normalizedPassword === SUPER_ADMIN_PASSWORD_ALT)
      ) {
        const userData: AuthUser = { name: "Theta HSE Super Admin", email: SUPER_ADMIN_EMAIL, role: "Admin", initials: "SA", allowedModules: ALL_MODULE_LABELS };
        setUser(userData);
        setIsAuthenticated(true);
        return "success";
      }
      if (trimmedEmail === INSPECTOR_EMAIL && password === INSPECTOR_PASSWORD) {
        const userData: AuthUser = { name: "Site Inspector", email: INSPECTOR_EMAIL, role: "Site Inspector", initials: "SI", allowedModules: ALL_MODULE_LABELS };
        setUser(userData);
        setIsAuthenticated(true);
        return "success";
      }
      if (trimmedEmail === ENGINEER_EMAIL && password === ENGINEER_PASSWORD) {
        const userData: AuthUser = { name: "Site Engineer", email: ENGINEER_EMAIL, role: "Site Engineer", initials: "SE", allowedModules: ALL_MODULE_LABELS };
        setUser(userData);
        setIsAuthenticated(true);
        return "success";
      }
      if (trimmedEmail === WORKER_EMAIL && password === WORKER_PASSWORD) {
        const userData: AuthUser = { name: "Worker", email: WORKER_EMAIL, role: "Worker", initials: "WK", allowedModules: ALL_MODULE_LABELS };
        setUser(userData);
        setIsAuthenticated(true);
        return "success";
      }
    }

    const isAdminCreds = ENABLE_DEV_TEST_ACCOUNTS && trimmedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD;

    try {
      const thetaResult = await loginWithThetaCredentials(trimmedEmail, normalizedPassword, orgCode);
      if (thetaResult.status === "success" && thetaResult.access_profile?.approved) {
        const profile = thetaResult.access_profile;
        const resolvedRole = mapOnboardingRoleToUserRole(profile.user_role);
        if (!isWebAllowedOnboardingRole(resolvedRole)) {
          clearLocalAuthState();
          return "access_denied";
        }
        const mappedModules = (profile.selected_modules ?? [])
          .map((m) => normalizeModuleLabel(m))
          .filter((m): m is UiModuleLabel => Boolean(m));
        const name = profile.user_name || profile.display_name || profile.worker_name || profile.admin_name || "Org Admin";
        const initials = name
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        const userData: AuthUser = {
          name,
          email: trimmedEmail,
          role: resolvedRole,
          initials,
          orgCode: profile.org_code,
          companyName: profile.company_name,
          allowedModules: mappedModules.length > 0 ? mappedModules : ALL_MODULE_LABELS,
          onboardingScoped: true,
          onboardingSetupRequired: Boolean(profile.setup_required),
          onboardingSetupCompleted: Boolean(profile.setup_completed),
          onboardingMaxUsers: Number(profile.active_workers ?? 0),
          onboardingConfiguredUsers: Number(profile.configured_users_count ?? 0),
        };
        const normalizedPlan = normalizeSubscriptionPlan(profile.subscription_plan);
        if (normalizedPlan) {
          setSubscriptionPlan(normalizedPlan);
        }
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("hse_auth", "true");
        localStorage.setItem("hse_user", JSON.stringify(userData));
        return "success";
      }
      if (thetaResult.status === "password_setup_required") {
        return "password_setup_required";
      }
      if (thetaResult.status === "pending_approval") {
        return "pending_approval";
      }
      if (thetaResult.status === "not_found") {
        // Product admin accounts may not exist in Theta onboarding submissions.
        // Fall through to Firebase/hardcoded paths instead of blocking login.
        if (!PRODUCT_ADMIN_EMAILS.has(trimmedEmail)) {
          return "user_not_found";
        }
      }
      if (thetaResult.status === "error") {
        const msg = String(thetaResult.error || thetaResult.reason || "").toLowerCase();
        if (msg.includes("network") || msg.includes("fetch") || msg.includes("timeout")) {
          return "network_error";
        }
        return "error";
      }
      if (thetaResult.status === "invalid_credentials") {
        // Credentials exist but password is wrong. Do not convert to
        // password_setup_required, otherwise user gets stuck in a loop.
        return "invalid_credentials";
      }
    } catch (thetaErr) {
      console.warn("Theta DB login unavailable, falling back to Firebase:", thetaErr);
      // Continue to Firebase fallback for all users.
      // This helps admin accounts still sign in when Theta endpoint is temporarily unavailable.
    }

    try {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code ?? "";
        // Firebase v9+ collapses user-not-found + wrong-password into invalid-credential.
        // If admin creds are correct but account doesn't exist yet, create it.
        if (isAdminCreds && (code === "auth/user-not-found" || code === "auth/invalid-credential")) {
          try {
            cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          } catch (createErr: unknown) {
            const createCode = (createErr as { code?: string })?.code ?? "";
            if (createCode === "auth/email-already-in-use") {
              return "invalid_credentials";
            }
            throw createErr;
          }
        } else if (code === "auth/user-not-found") {
          try {
            const profile = await getOnboardingAccessProfile(trimmedEmail, orgCode);
            if (profile?.found && profile?.approved) {
              return "password_setup_required";
            }
          } catch {
            // ignore profile lookup errors; fallback to standard result
          }
          return "user_not_found";
        } else if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
          // First-time non-Google path:
          // If onboarding is approved but no email/password sign-in method exists,
          // force user to set password manually via Create account.
          try {
            const signInMethods = await fetchSignInMethodsForEmail(auth, trimmedEmail);
            if (signInMethods.length > 0) {
              return "invalid_credentials";
            }

            const profile = await getOnboardingAccessProfile(trimmedEmail, orgCode);
            if (profile?.found && profile?.approved) {
              return "password_setup_required";
            }
            return "invalid_credentials";
          } catch {
            return "invalid_credentials";
          }
        } else {
          throw err;
        }
      }
      const access = await resolveFirestoreUser(cred.user, orgCode);
      if (access === "approved") return "success";
      if (access === "denied") return "access_denied";
      return "pending_approval";
    } catch (err) {
      console.error("Login error:", err);
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/network-request-failed") {
        return "network_error";
      }
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        return "invalid_credentials";
      }
      if (code === "auth/user-not-found") {
        return "user_not_found";
      }
      if (code === "auth/too-many-requests") {
        return "invalid_credentials";
      }
      return "error";
    }
  };

  const loginWithGoogle = async (): Promise<LoginResult> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const access = await resolveFirestoreUser(result.user);
      if (access === "approved") return "success";
      if (access === "denied") return "access_denied";
      return "pending_approval";
    } catch (error) {
      console.error("Error signing in with Google:", error);
      const code = (error as { code?: string })?.code ?? "";
      if (code === "auth/network-request-failed") {
        return "network_error";
      }
      return "error";
    }
  };

  const signup = async (email: string, password: string): Promise<LoginResult> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password.trim()) {
      return "invalid_credentials";
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const access = await resolveFirestoreUser(cred.user);
      if (access === "approved") return "success";
      if (access === "denied") return "access_denied";
      return "pending_approval";
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/email-already-in-use") {
        try {
          const profile = await getOnboardingAccessProfile(trimmedEmail);
          if (profile?.found && profile?.approved) {
            return "password_setup_required";
          }
        } catch {
          // ignore profile lookup errors and fallback to generic handling
        }
        return "invalid_credentials";
      }
      if (code === "auth/invalid-email" || code === "auth/weak-password") {
        return "invalid_credentials";
      }
      if (code === "auth/network-request-failed") {
        return "network_error";
      }
      console.error("Signup error:", err);
      return "error";
    }
  };

  const logout = () => {
    // Clear JWT token from our FastAPI backend
    localStorage.removeItem("hse_jwt_token");
    localStorage.removeItem("hse_auth");
    localStorage.removeItem("hse_user");
    setIsAuthenticated(false);
    setUser(null);
    // Attempt Firebase sign-out only if Firebase is configured; ignore errors
    signOut(auth).catch(() => {});
  };

  const markOnboardingSetupCompleted = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: AuthUser = {
        ...prev,
        onboardingSetupRequired: false,
        onboardingSetupCompleted: true,
      };
      localStorage.setItem("hse_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, accessibleKPIs, canViewKPI, canAccessModuleLabel, isOnboardingScopedUser, login, signup, loginWithGoogle, logout, markOnboardingSetupCompleted, subscriptionPlan, setSubscriptionPlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
