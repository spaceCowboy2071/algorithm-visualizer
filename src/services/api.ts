// ── API Service Layer ──
// Fetch wrapper that handles JWT auto-attach, silent token refresh on 401,
// and stampede prevention (only one refresh request at a time).
//
// The access token is stored in a module-level variable — NOT localStorage.
// Why? localStorage is readable by any JS on the page (XSS risk).
// A module variable is wiped on page refresh, which triggers a cookie-based
// refresh anyway (the httpOnly refresh token cookie persists across refreshes).

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ── Token Management ──
// Module-level so api.ts can attach it to requests without needing React context.
// AuthContext calls setAccessToken() after login/signup/refresh.

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// ── Stampede Prevention ──
// If multiple requests get 401 simultaneously, only the FIRST one triggers
// a refresh. The rest wait for that single refresh to complete, then retry
// with the new token. Without this, you'd fire N refresh requests at once.

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // If a refresh is already in-flight, piggyback on it
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends the httpOnly refresh token cookie
      });

      if (!res.ok) {
        // Refresh failed — token expired or revoked. User must log in again.
        setAccessToken(null);
        return null;
      }

      const data = await res.json();
      setAccessToken(data.token);
      return data.token;
    } catch {
      // Network error — can't reach server
      setAccessToken(null);
      return null;
    } finally {
      // Clear the lock so future 401s can trigger a new refresh
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Core Fetch Wrapper ──
// Every API call goes through this. It:
// 1. Attaches the access token as Authorization header
// 2. On 401, silently refreshes and retries ONCE
// 3. Parses JSON responses
// 4. Throws ApiError with structured error info for the UI to handle

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    super(typeof data.error === 'string' ? data.error : `API error ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  skipAuth?: boolean; // For auth endpoints that don't need a token (signup, login)
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include', // always send cookies (for refresh token)
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  let res = await fetch(`${API_URL}${endpoint}`, config);

  // ── Silent Refresh on 401 ──
  // If the access token expired, try to refresh and retry the request ONCE.
  // skipAuth requests (login/signup) should not trigger refresh on failure.
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry the original request with the fresh token
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${endpoint}`, { ...config, headers });
    }
  }

  // Parse response
  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as T;
}

// ── Auth Types ──

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  id: string;
  email: string;
  displayName: string | null;
  authProvider: string;
  createdAt: string;
}

// ── Progress Types ──

export interface ProgressRecord {
  id: string;
  problemId: number;
  status: string;
  solvedIndependently: boolean;
  solvedIn20Min: boolean;
  confidence: number;
  attemptCount: number;
  lastAttempted: string | null;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  notes: string | null;
  savedCodeJs: string | null;
  savedCodePython: string | null;
}

export interface DashboardStats {
  total: number;
  solved: number;
  studied: number;
  inProgress: number;
  review: number;
  notStarted: number;
  solvedIndependently: number;
  solvedIn20Min: number;
  avgConfidence: number;
}

// ── Auth API ──

export const auth = {
  signup(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    return request('/api/auth/signup', {
      method: 'POST',
      body: { email, password, displayName },
      skipAuth: true,
    });
  },

  login(email: string, password: string): Promise<AuthResponse> {
    return request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    });
  },

  google(credential: string): Promise<AuthResponse> {
    return request('/api/auth/google', {
      method: 'POST',
      body: { credential },
      skipAuth: true,
    });
  },

  refresh(): Promise<AuthResponse> {
    return request('/api/auth/refresh', {
      method: 'POST',
      skipAuth: true, // refresh uses cookie, not Bearer token
    });
  },

  me(): Promise<MeResponse> {
    return request('/api/auth/me');
  },
};

// ── Progress API ──

export const progress = {
  getAll(): Promise<ProgressRecord[]> {
    return request('/api/progress');
  },

  getOne(problemId: number): Promise<ProgressRecord | null> {
    return request(`/api/progress/${problemId}`);
  },

  upsert(problemId: number, data: Record<string, unknown>): Promise<ProgressRecord> {
    return request(`/api/progress/${problemId}`, {
      method: 'PUT',
      body: data,
    });
  },

  dashboard(): Promise<DashboardStats> {
    return request('/api/progress/dashboard');
  },
};
