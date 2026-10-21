'use client';

import { useState, useEffect } from 'react';

export type OnboardingRole = 'collector' | 'collection' | 'inventory' | 'facilitator';

const ONBOARDING_KEYS: Record<OnboardingRole, string> = {
  collector: 'onboarded:collector',
  collection: 'onboarded:collection',
  inventory: 'onboarded:inventory',
  facilitator: 'onboarded:facilitator',
};

const FIRST_REQUEST_KEY = 'onboarded:collector_first_request';

export function getOnboardingStatus(role: OnboardingRole): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(ONBOARDING_KEYS[role]) === 'true';
  } catch {
    return true;
  }
}

export function setOnboardingCompleted(role: OnboardingRole): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDING_KEYS[role], 'true');
  } catch {
    // Ignore
  }
}

export function resetOnboardingRole(role: OnboardingRole): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ONBOARDING_KEYS[role]);
  } catch {
    // Ignore
  }
}

export function resetAllOnboarding(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ONBOARDING_KEYS.collector);
    localStorage.removeItem(ONBOARDING_KEYS.collection);
    localStorage.removeItem(ONBOARDING_KEYS.inventory);
    localStorage.removeItem(ONBOARDING_KEYS.facilitator);
    localStorage.removeItem(FIRST_REQUEST_KEY);
  } catch {
    // Ignore
  }
}

export function getFirstRequestStatus(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(FIRST_REQUEST_KEY) === 'true';
  } catch {
    return true;
  }
}

export function setFirstRequestCompleted(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FIRST_REQUEST_KEY, 'true');
  } catch {
    // Ignore
  }
}

/**
 * Hook to manage role-specific first-run onboarding states.
 */
export function useRoleOnboarding(role: OnboardingRole) {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const val = localStorage.getItem(ONBOARDING_KEYS[role]);
      setIsOnboarded(val === 'true');
    } catch {
      setIsOnboarded(true);
    } finally {
      setIsLoaded(true);
    }
  }, [role]);

  const complete = () => {
    setIsOnboarded(true);
    setOnboardingCompleted(role);
  };

  const reset = () => {
    setIsOnboarded(false);
    resetOnboardingRole(role);
  };

  return {
    isOnboarded,
    isLoaded,
    complete,
    reset,
  };
}
