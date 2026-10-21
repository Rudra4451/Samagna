'use client';

import { useState, useEffect, useCallback } from 'react';

export type FontScale = 16 | 18 | 20;

const STORAGE_KEY = 'banasetu_font_scale';

export function useFontScale() {
  const [fontScale, setFontScaleState] = useState<FontScale>(16);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === '16' || saved === '18' || saved === '20') {
        const scale = Number(saved) as FontScale;
        setFontScaleState(scale);
        applyScaleToDOM(scale);
      }
    } catch {
      // Ignore localStorage access issues in sandbox
    }
  }, []);

  const applyScaleToDOM = (scale: FontScale) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--base-font-scale', `${scale}px`);
      document.documentElement.setAttribute('data-font-scale', String(scale));
    }
  };

  const setFontScale = useCallback((scale: FontScale) => {
    setFontScaleState(scale);
    applyScaleToDOM(scale);
    try {
      localStorage.setItem(STORAGE_KEY, String(scale));
    } catch {
      // Ignore
    }
  }, []);

  const cycleFontScale = useCallback(() => {
    setFontScaleState((prev) => {
      const next: FontScale = prev === 16 ? 18 : prev === 18 ? 20 : 16;
      applyScaleToDOM(next);
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  return {
    fontScale,
    setFontScale,
    cycleFontScale,
  };
}
