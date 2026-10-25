'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, AuthUser } from '@/store/useAppStore';

// Inactivity timeout: 30 minutes of idle time
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export function useAuthSession() {
  const router = useRouter();
  const { authUser, setAuthUser } = useAppStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(async (reason?: 'timeout' | 'loggedout') => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout endpoint call failed:', err);
    }
    setAuthUser(null);
    const dest = reason ? `/login?reason=${reason}` : '/login';
    window.location.href = dest;
  }, [setAuthUser]);

  // Reset inactivity timer on user interactions
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      logout('timeout');
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  // Load session from /api/auth/me on mount
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setAuthUser(data.user as AuthUser);
          }
        } else if (res.status === 401) {
          if (isMounted) setAuthUser(null);
        }
      } catch {
        // Safe offline mode fallback
      }
    }

    checkSession();

    // Attach user activity listeners for session timeout
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      isMounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [setAuthUser, resetTimer]);

  return {
    user: authUser,
    isAuthenticated: Boolean(authUser),
    role: authUser?.role,
    logout,
  };
}
