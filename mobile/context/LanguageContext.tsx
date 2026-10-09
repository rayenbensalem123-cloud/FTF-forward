import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { STRINGS, type StringKey } from '@/i18n/strings';
import type { Language } from '@/types';

interface LanguageValue {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: StringKey) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const t = useCallback((key: StringKey) => STRINGS[language][key], [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
