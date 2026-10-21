'use client';

import { useAppStore } from '../store/useAppStore';
import en from './en.json';
import or from './or.json';

export type TranslationKey = keyof typeof en;

export function useTranslation() {
  const language = useAppStore((state) => state.language);
  const isOr = language === 'OR';

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = isOr ? (or as Record<string, string>) : (en as Record<string, string>);
    let text = dict[key] || (en as Record<string, string>)[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }

    return text;
  };

  return { t, language, isOr };
}
