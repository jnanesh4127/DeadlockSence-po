import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  SupportedLocale,
  SUPPORTED_LOCALES,
  translations,
  TranslationDict
} from '../i18n/translations.ts';

const STORAGE_KEY = 'deadlocksense_locale';

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (next: SupportedLocale) => void;
  t: TranslationDict;
  locales: typeof SUPPORTED_LOCALES;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getInitialLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
    if (saved && saved in translations) {
      return saved;
    }
    const browserLang = navigator.language?.slice(0, 2).toLowerCase() as SupportedLocale;
    if (browserLang && browserLang in translations) {
      return browserLang;
    }
  } catch {
    // Ignore storage access failures
  }
  return 'en';
}

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(getInitialLocale);

  const setLocale = (next: SupportedLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage write failures
    }
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t: translations[locale] as TranslationDict,
        locales: SUPPORTED_LOCALES
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
};
