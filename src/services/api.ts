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
// All calls that hit /api/auth/refresh route through silentRefresh so a single
// in-flight promise is shared across every caller. Two refresh-token-rotation
// scenarios this protects against:
//   1. Multiple requests get 401 simultaneously — without dedup we'd fire N
//      refresh requests, each rotating the token, and the server's reuse
//      detection would nuke all sessions.
//   2. React 19 Strict Mode double-fires AuthContext's silent-refresh-on-mount
//      effect in dev. Without dedup, the second fire replays the just-rotated
//      token, triggers reuse detection, and logs the user out on every page
//      refresh.
// Returning null on failure (instead of throwing) lets callers branch with a
// simple `if (data)` rather than try/catch.

let refreshPromise: Promise<AuthResponse | null> | null = null;

export async function silentRefresh(): Promise<AuthResponse | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends the httpOnly refresh token cookie
      });

      if (!res.ok) {
        setAccessToken(null);
        return null;
      }

      const data = (await res.json()) as AuthResponse;
      setAccessToken(data.token);
      return data;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      // Clear the lock so future refresh attempts (e.g., next page load,
      // next 401) can fire fresh.
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
  // skipAuth requests (login/signup/refresh) should not trigger refresh on failure.
  if (res.status === 401 && !skipAuth) {
    const refreshed = await silentRefresh();

    if (refreshed) {
      // Retry the original request with the fresh token
      headers['Authorization'] = `Bearer ${refreshed.token}`;
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

// ── Sketches Types ──

export interface SketchData {
  name?: string;
  strokes: unknown[];        // server uses envelope-only validation; client owns the shape
  canvasWidth: number;
  canvasHeight: number;
}

export interface SketchRecord {
  id?: string;
  problemId: number;
  strokeData: SketchData;
  updatedAt: string | null;  // null when no row exists yet (empty default response)
}

// ── Whiteboards Types ──
// Same JSONB envelope shape as sketches — strokes + canvas dimensions — but
// no name field (one whiteboard per user; naming would be redundant) and no
// problemId (URL has no parameter, the JWT identifies the user).

export interface WhiteboardData {
  strokes: unknown[];        // server uses envelope-only validation; client owns the shape
  canvasWidth: number;
  canvasHeight: number;
}

export interface WhiteboardRecord {
  id?: string;
  strokeData: WhiteboardData;
  updatedAt: string | null;  // null when no row exists yet (empty default response)
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

  // Note: refresh is exposed at module scope as `silentRefresh` (above) rather
  // than on the auth namespace, because it has stampede-prevention semantics
  // that callers must not bypass. Calling `request('/api/auth/refresh')`
  // directly would skip the dedup lock and risk double-rotating the refresh
  // token under React Strict Mode or concurrent 401s.

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

// ── Sketches API ──

export const sketches = {
  get(problemId: number): Promise<SketchRecord> {
    return request(`/api/sketches/${problemId}`);
  },

  save(problemId: number, payload: SketchData): Promise<SketchRecord> {
    return request(`/api/sketches/${problemId}`, {
      method: 'PUT',
      body: payload,
    });
  },

  remove(problemId: number): Promise<void> {
    return request(`/api/sketches/${problemId}`, { method: 'DELETE' });
  },
};

// ── Whiteboards API ──
// One whiteboard per authenticated user — JWT identifies which one, so no URL
// parameter. No DELETE for v1 (PUT with empty strokes is the "clear" operation;
// removing the row entirely has no user-facing equivalent for one-per-user data).

export const whiteboards = {
  get(): Promise<WhiteboardRecord> {
    return request('/api/whiteboards');
  },

  save(payload: WhiteboardData): Promise<WhiteboardRecord> {
    return request('/api/whiteboards', {
      method: 'PUT',
      body: payload,
    });
  },
};
