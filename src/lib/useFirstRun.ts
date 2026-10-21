'use client';

import { useState, useEffect } from 'react';

const FIRST_RUN_KEY = 'banasetu_collector_first_run_completed';

/**
 * Hook for Prompt 14 Onboarding / First-Run experience.
 * When isFirstRun is true, the app will show the introductory step-by-step
 * field guidance flow when implemented.
 */
export function useFirstRun() {
  const [isFirstRun, setIsFirstRun] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const completed = localStorage.getItem(FIRST_RUN_KEY);
      setIsFirstRun(completed !== 'true');
    } catch {
      setIsFirstRun(false);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const completeFirstRun = () => {
    setIsFirstRun(false);
    try {
      localStorage.setItem(FIRST_RUN_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const resetFirstRun = () => {
    setIsFirstRun(true);
    try {
      localStorage.removeItem(FIRST_RUN_KEY);
    } catch {
      // Ignore
    }
  };

  return {
    isFirstRun,
    isLoaded,
    completeFirstRun,
    resetFirstRun,
  };
}
