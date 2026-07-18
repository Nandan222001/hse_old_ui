export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/employee/refresh',
    PROFILE: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
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
    NEAR_MISS: '/driver/incidents/near-miss',
    UNSAFE_ACT: '/driver/incidents/unsafe-act',
    DETAIL: (id: string) => `/driver/incidents/${id}`,
  },

  // Hazards / Risk observations
  HAZARDS: {
    CREATE: '/hazards',
    CATEGORIES: '/hazard-categorys',
  },

  // Checklists
  CHECKLISTS: {
    LIST: '/driver/checklists',
    DETAIL: (id: string) => `/driver/checklists/${id}`,
    SUBMIT: (id: string) => `/driver/checklists/${id}/submit`,
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
