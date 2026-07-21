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
  },
} as const;
