// API endpoint constants
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    ME: "/api/auth/me",
  },

  // URLs
  URLS: {
    LIST: "/api/urls",
    CREATE: "/api/urls",
    DELETE: "/api/urls",
    GET: (id: string) => `/api/urls/${id}`,
    START: (id: string) => `/api/urls/${id}/start`,
    STOP: (id: string) => `/api/urls/${id}/stop`,
    RERUN: (id: string) => `/api/urls/${id}/rerun`,
  },

  // WebSocket
  WEBSOCKET: "/ws",
} as const
