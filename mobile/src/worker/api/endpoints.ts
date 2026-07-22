export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/employee/refresh',
    PROFILE: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    /** Full employee record for the signed-in user (role, department, manager, dates). */
    MY_EMPLOYEE_PROFILE: '/employees/me',
    /** Profile photo, stored as a base64 data URI. */
    MY_EMPLOYEE_PHOTO: '/employees/me/photo',
  },

  // Tasks
  TASKS: {
    LIST: '/worker/tasks',
    DETAIL: (id: string) => `/worker/tasks/${id}`,
    COMPLETE_STEP: (id: string) => `/worker/tasks/${id}/complete-step`,
    SHIFT_SUMMARY: '/worker/tasks/shift-summary',
  },

  // Permits
  PERMITS: {
    LIST: '/worker/permits',
    CREATE: '/worker/permits',
    DETAIL: (id: string) => `/worker/permits/${id}`,
    ACKNOWLEDGE: (id: string) => `/worker/permits/${id}/acknowledge`,
  },

  // Incidents
  INCIDENTS: {
    LIST: '/worker/incidents',
    REPORT: '/worker/incidents',
    DETAIL: (id: string) => `/worker/incidents/${id}`,
    MY_REPORTS: '/incident-workflow/my-reports',
  },

  // Near miss / unsafe act / risk each have their own table and their own
  // Worker→Supervisor→Manager workflow. The old /worker/incidents/near-miss and
  // /worker/incidents/unsafe-act paths never existed on the backend and 404'd.
  NEAR_MISS: {
    REPORT: '/near-miss-workflow/report',
    MY_REPORTS: '/near-miss-workflow/my-reports',
    DETAIL: (id: string | number) => `/near-miss-workflow/${id}`,
  },

  UNSAFE_ACT: {
    REPORT: '/unsafe-act-workflow/report',
    MY_REPORTS: '/unsafe-act-workflow/my-reports',
    DETAIL: (id: string | number) => `/unsafe-act-workflow/${id}`,
  },

  RISK: {
    REPORT: '/risk-workflow/report',
    MY_REPORTS: '/risk-workflow/my-reports',
    DETAIL: (id: string | number) => `/risk-workflow/${id}`,
  },

  // Hazard catalog (reference data), NOT worker risk reports — those go to RISK above.
  HAZARDS: {
    CATEGORIES: '/hazard-categorys',
  },

  // Checklists
  CHECKLISTS: {
    LIST: '/worker/checklists',
    DETAIL: (id: string) => `/worker/checklists/${id}`,
    SUBMIT: (id: string) => `/worker/checklists/${id}/submit`,
    // Real submission records (the /checklists API the checklist screen writes to),
    // as opposed to the /worker/checklists stubs above.
    SUBMISSIONS: '/checklists/submissions',
  },

  // Training
  TRAINING: {
    LIST: '/worker/training',
    DETAIL: (id: string) => `/worker/training/${id}`,
    ASSESSMENT: (id: string) => `/worker/training/${id}/assessment`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/worker/notifications',
    MARK_READ: (id: string) => `/worker/notifications/${id}/read`,
    MARK_ALL_READ: '/worker/notifications/read-all',
  },
} as const;
