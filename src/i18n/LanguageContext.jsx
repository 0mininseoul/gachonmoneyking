import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    // Detect browser language on first load
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const shortLang = browserLang.split('-')[0].toLowerCase();
    
    // Check if the shortLang is one of our supported locales
    if (translations[shortLang]) {
      setLocale(shortLang);
    } else {
      setLocale('en'); // fallback to English
    }
  }, []);

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

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
