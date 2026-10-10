import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STRINGS, type StringKey } from '@/i18n/strings';
import { getJson, KEYS, setJson } from '@/lib/storage';
import type { Language } from '@/types';

interface LanguageValue {
  language: Language;
  /** True when the UI should flow right-to-left (Arabic). */
  isRtl: boolean;
  /** True once the language saved on the device has been restored. */
  ready: boolean;
  setLanguage: (l: Language) => void;
  t: (key: StringKey) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [ready, setReady] = useState(false);

  // Restore the saved language on launch. Storage is async, so screens that
  // must not flash the wrong text or direction wait for `ready`.
  useEffect(() => {
    let alive = true;
    void getJson<{ language: Language }>(KEYS.settings).then((saved) => {
      if (!alive) return;
      if (saved && saved.language in STRINGS) setLanguageState(saved.language);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setLanguage = useCallback((l: Language) => {
    setLanguageState(l);
    void setJson(KEYS.settings, { language: l });
  }, []);

  const isRtl = language === 'ar';
  const t = useCallback((key: StringKey) => STRINGS[language][key], [language]);
  const value = useMemo(() => ({ language, isRtl, ready, setLanguage, t }), [language, isRtl, ready, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
