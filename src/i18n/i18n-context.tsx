/**
 * i18n Context & Hook
 * Provides bilingual support (EN/FA) and bidirectional layout management (LTR/RTL).
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Locale, TextDirection, TranslationSchema } from './types';
import { en } from './translations/en';
import { fa } from './translations/fa';
import { PreferencesStore } from '../config/user-preferences';

interface I18nContextValue {
  locale: Locale;
  direction: TextDirection;
  isRTL: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslationSchema;
}

const translations: Record<Locale, TranslationSchema> = {
  en,
  fa,
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const prefs = PreferencesStore.getPreferences();
    return prefs.locale || 'en';
  });

  const direction: TextDirection = locale === 'fa' ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = direction;
    }
  }, [locale, direction]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    PreferencesStore.savePreferences({ locale: newLocale });
  };

  const toggleLocale = () => {
    const nextLocale: Locale = locale === 'en' ? 'fa' : 'en';
    setLocale(nextLocale);
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      direction,
      isRTL,
      setLocale,
      toggleLocale,
      t: translations[locale] || translations.en,
    }),
    [locale, direction, isRTL],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
