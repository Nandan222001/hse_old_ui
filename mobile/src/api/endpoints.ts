export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  PERMITS: {
    LIST: '/supervisor/permits',
    DETAIL: (id: string) => `/supervisor/permits/${id}`,
    APPROVE: (id: string) => `/supervisor/permits/${id}/approve`,
    REJECT: (id: string) => `/supervisor/permits/${id}/reject`,
    ACKNOWLEDGE: (id: string) => `/supervisor/permits/${id}/acknowledge`,
  },
  TEAM: {
    MEMBERS: '/supervisor/team/members',
    SHIFT_STATUS: '/supervisor/team/shift-status',
    TOOLBOX_TALK: '/supervisor/team/toolbox-talk',
    SUBMIT_TOOLBOX: '/supervisor/team/toolbox-talk/submit',
    ATTENDANCE: '/supervisor/team/attendance',
    FORCE_IN: (id: string) => `/supervisor/team/members/${id}/force-in`,
    LOG_HOURS: '/supervisor/team/log-hours',
  },
  COMPLIANCE: {
    METRICS: '/supervisor/compliance/metrics',
    EXCEPTIONS: '/supervisor/compliance/exceptions',
    GEAR_CHECK: '/supervisor/compliance/gear-check',
    EXPIRING_PERMITS: '/supervisor/compliance/expiring-permits',
    REMIND: (id: string) => `/supervisor/compliance/exceptions/${id}/remind`,
  },
  REPORTS: {
    LIST: '/supervisor/reports',
    SAFETY_WALKS: '/supervisor/reports/safety-walks',
    INCIDENTS: '/supervisor/reports/incidents',
  },
  DASHBOARD: {
    STATS:  '/supervisor/dashboard',
    ALERTS: '/supervisor/alerts',
  },
  INCIDENT_WORKFLOW: {
    ACKNOWLEDGE: (id: string) => `/incident-workflow/${id}/acknowledge`,
    INVESTIGATE: (id: string) => `/incident-workflow/${id}/investigate`,
    ESCALATE: (id: string) => `/incident-workflow/${id}/escalate`,
    MANAGER_QUEUE: '/incident-workflow/manager-queue',
    APPROVE: (id: string) => `/incident-workflow/${id}/approve-investigation`,
    CLOSE: (id: string) => `/incident-workflow/${id}/close`,
    DETAIL: (id: string) => `/incident-workflow/${id}`,
    CAPA_MY_ACTIONS: '/incident-workflow/capa/my-actions',
    CAPA_COMPLETE: (id: string | number) => `/incident-workflow/capa/${id}/complete`,
  },
} as const;

/**
 * The four worker-submitted report types, each with its own table and its own
 * routes on the backend. Every type exposes the identical Worker→Supervisor→Manager
 * verbs, so the supervisor and manager screens can drive any of them through one
 * shape instead of four hand-written services.
 */
export const REPORT_TYPES = ['incident', 'near_miss', 'unsafe_act', 'risk'] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

const REPORT_WORKFLOW_PREFIX: Record<ReportType, string> = {
  incident: '/incident-workflow',
  near_miss: '/near-miss-workflow',
  unsafe_act: '/unsafe-act-workflow',
  risk: '/risk-workflow',
};

/** Build the workflow endpoint set for one report type. */
export const reportWorkflowEndpoints = (type: ReportType) => {
  const base = REPORT_WORKFLOW_PREFIX[type];
  return {
    // Worker
    REPORT: `${base}/report`,
    MY_REPORTS: `${base}/my-reports`,
    // Supervisor
    PENDING_REVIEW: `${base}/pending-review`,
    ACKNOWLEDGE: (id: string | number) => `${base}/${id}/acknowledge`,
    INVESTIGATE: (id: string | number) => `${base}/${id}/investigate`,
    ESCALATE: (id: string | number) => `${base}/${id}/escalate`,
    // Manager
    MANAGER_QUEUE: `${base}/manager-queue`,
    APPROVE: (id: string | number) => `${base}/${id}/approve-investigation`,
    CLOSE: (id: string | number) => `${base}/${id}/close`,
    // Shared
    STATS: `${base}/stats/summary`,
    DETAIL: (id: string | number) => `${base}/${id}`,
  };
};

/**
 * Permit to Work workflow (flow 6): Worker raises → Supervisor acknowledges →
 * Manager approves / rejects & monitors → Auditor verifies on site.
 */
export const PERMIT_WORKFLOW = {
  // Worker
  REQUEST: '/permit-workflow/request',
  MY_PERMITS: '/permit-workflow/my-permits',
  // Supervisor
  PENDING_REVIEW: '/permit-workflow/pending-review',
  ACKNOWLEDGE: (id: string | number) => `/permit-workflow/${id}/acknowledge`,
  // Manager
  MANAGER_QUEUE: '/permit-workflow/manager-queue',
  APPROVE: (id: string | number) => `/permit-workflow/${id}/approve`,
  REJECT: (id: string | number) => `/permit-workflow/${id}/reject`,
  ACTIVE: '/permit-workflow/active',
  CLOSE: (id: string | number) => `/permit-workflow/${id}/close`,
  // Auditor
  AUDIT_LIST: '/permit-workflow/audit-list',
  VERIFY: (id: string | number) => `/permit-workflow/${id}/verify`,
  CLOSE: (id: string | number) => `/permit-workflow/${id}/close`,
  // Shared
  STATS: '/permit-workflow/stats/summary',
  DETAIL: (id: string | number) => `/permit-workflow/${id}`,
} as const;

/**
 * Hazard register workflow (flow 5): log → review → auditor verification.
 */
export const HAZARD_REGISTER = {
  LOG: '/hazard-register/log',
  LIST: '/hazard-register',
  MY_LOGS: '/hazard-register/my-logs',
  REVIEW: (id: string | number) => `/hazard-register/${id}/review`,
  AUDIT_LIST: '/hazard-register/audit-list',
  VERIFY: (id: string | number) => `/hazard-register/${id}/verify`,
  STATS: '/hazard-register/stats/summary',
} as const;
