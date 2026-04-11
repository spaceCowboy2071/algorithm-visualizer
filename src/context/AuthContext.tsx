// ── Auth Context ──
// Manages user authentication state across the app.
//
// Access token lives in api.ts module variable (not localStorage — XSS risk).
// AuthContext keeps a React-level copy of user info so components can react
// to login/logout. On mount, it attempts a silent refresh via the httpOnly
// cookie to restore sessions after page refresh.
//
// Dependency direction: AuthContext → api.ts → server.
// AuthContext also orchestrates the tracker store: hydrate on login, clear on
// logout, migrate localStorage on first signup. The store itself doesn't know
// about React context — AuthContext calls its exported functions directly.

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { auth, progress as progressApi, setAccessToken, type AuthUser } from '../services/api';
import { AuthContext } from './authConstants';
import {
  setAuthenticated,
  hydrateFromServer,
  clearState,
  migrateLocalStorageToServer,
} from '../hooks/useTrackerStore';

/** Fetch all progress from server and pour it into the tracker store. */
async function hydrateTracker() {
  try {
    const records = await progressApi.getAll();
    hydrateFromServer(records);
  } catch (err) {
    console.warn('[auth] Failed to hydrate tracker from server:', err);
  }
}

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
          setAuthenticated(true);
          await hydrateTracker();
        }
      } catch {
        // No valid refresh token — user is not logged in. That's fine.
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
          setAuthenticated(false);
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
    setAuthenticated(true);
    await hydrateTracker();
  }, []);

  // ── Signup ──
  // On signup, we check for existing localStorage progress and migrate it
  // to the server before hydrating. This preserves any work the user did
  // before creating an account.
  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    const data = await auth.signup(email, password, displayName);
    setAccessToken(data.token);
    setUser(data.user);
    setAuthenticated(true);

    // One-time migration: push localStorage data to server, then clear it
    await migrateLocalStorageToServer();

    await hydrateTracker();
  }, []);

  // ── Google Sign-In ──
  // Google sign-in could be a first-time user (like signup) or a returning
  // user (like login). We migrate localStorage just in case — if there's
  // nothing to migrate, the function returns immediately.
  const googleSignIn = useCallback(async (credential: string) => {
    const data = await auth.google(credential);
    setAccessToken(data.token);
    setUser(data.user);
    setAuthenticated(true);

    await migrateLocalStorageToServer();

    await hydrateTracker();
  }, []);

  // ── Logout ──
  // Clear access token from memory, user from state, and empty the tracker.
  // The refresh token cookie will be cleared by the browser when it expires,
  // or we could add a server-side logout endpoint later to revoke it.
  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setAuthenticated(false);
    clearState();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, googleSignIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
