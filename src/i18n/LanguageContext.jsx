import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';
import { normalizeLocale } from '../lib/qrAttribution';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => getInitialLocale());

  useEffect(() => {
    setLocaleState(getInitialLocale());
  }, []);

  const setLocale = (nextLocale) => {
    setLocaleState(normalizeLocale(nextLocale, 'en'));
  };

  const t = (key) => {
    const localeTranslations = translations[locale] || translations['en'];
    return localeTranslations[key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

function getInitialLocale() {
  if (typeof window === 'undefined') return 'en';

  const urlLocale = new URLSearchParams(window.location.search).get('lang');
  if (urlLocale) return normalizeLocale(urlLocale, 'en');

  const browserLang = navigator.language || navigator.userLanguage || 'en';
  const browserLocale = normalizeLocale(browserLang, 'en');
  return translations[browserLocale] ? browserLocale : 'en';
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
