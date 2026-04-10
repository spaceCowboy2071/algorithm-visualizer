// ── Auth Context ──
// Manages user authentication state across the app.
//
// Access token lives in api.ts module variable (not localStorage — XSS risk).
// AuthContext keeps a React-level copy of user info so components can react
// to login/logout. On mount, it attempts a silent refresh via the httpOnly
// cookie to restore sessions after page refresh.
//
// Dependency direction: AuthContext → api.ts → server.
// useTrackerStore will listen to AuthContext (not the other way around).

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { auth, setAccessToken, type AuthUser } from '../services/api';
import { AuthContext } from './authConstants';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Silent Refresh on Mount ──
  // When the app loads, we don't know if the user is logged in. The access
  // token (in-memory) is gone after a page refresh. But the httpOnly refresh
  // token cookie persists. So we try POST /api/auth/refresh — if the cookie
  // is valid, we get a new access token and user info back.
  useEffect(() => {
    let cancelled = false;

    async function tryRefresh() {
      try {
        const data = await auth.refresh();
        if (!cancelled) {
          setAccessToken(data.token);
          setUser(data.user);
        }
      } catch {
        // No valid refresh token — user is not logged in. That's fine.
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    tryRefresh();
    return () => { cancelled = true; };
  }, []);

  // ── Login ──
  const login = useCallback(async (email: string, password: string) => {
    const data = await auth.login(email, password);
    setAccessToken(data.token);
    setUser(data.user);
  }, []);

  // ── Signup ──
  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    const data = await auth.signup(email, password, displayName);
    setAccessToken(data.token);
    setUser(data.user);
  }, []);

  // ── Google Sign-In ──
  const googleSignIn = useCallback(async (credential: string) => {
    const data = await auth.google(credential);
    setAccessToken(data.token);
    setUser(data.user);
  }, []);

  // ── Logout ──
  // Clear access token from memory and user from state.
  // The refresh token cookie will be cleared by the browser when it expires,
  // or we could add a server-side logout endpoint later to revoke it.
  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, googleSignIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
