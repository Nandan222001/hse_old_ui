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
    LIST: '/driver/tasks',
    DETAIL: (id: string) => `/driver/tasks/${id}`,
    COMPLETE_STEP: (id: string) => `/driver/tasks/${id}/complete-step`,
    SHIFT_SUMMARY: '/driver/tasks/shift-summary',
  },

  // Permits
  PERMITS: {
    LIST: '/driver/permits',
    CREATE: '/driver/permits',
    DETAIL: (id: string) => `/driver/permits/${id}`,
    ACKNOWLEDGE: (id: string) => `/driver/permits/${id}/acknowledge`,
  },

  // Incidents
  INCIDENTS: {
    LIST: '/driver/incidents',
    REPORT: '/driver/incidents',
    DETAIL: (id: string) => `/driver/incidents/${id}`,
    MY_REPORTS: '/incident-workflow/my-reports',
  },

  // Near miss / unsafe act / risk each have their own table and their own
  // Worker→Supervisor→Manager workflow. The old /driver/incidents/near-miss and
  // /driver/incidents/unsafe-act paths never existed on the backend and 404'd.
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
    LIST: '/driver/checklists',
    DETAIL: (id: string) => `/driver/checklists/${id}`,
    SUBMIT: (id: string) => `/driver/checklists/${id}/submit`,
    // Real submission records (the /checklists API the checklist screen writes to),
    // as opposed to the /driver/checklists stubs above.
    SUBMISSIONS: '/checklists/submissions',
  },

  // Training
  TRAINING: {
    LIST: '/driver/training',
    DETAIL: (id: string) => `/driver/training/${id}`,
    ASSESSMENT: (id: string) => `/driver/training/${id}/assessment`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/driver/notifications',
    MARK_READ: (id: string) => `/driver/notifications/${id}/read`,
    MARK_ALL_READ: '/driver/notifications/read-all',
  },
} as const;
