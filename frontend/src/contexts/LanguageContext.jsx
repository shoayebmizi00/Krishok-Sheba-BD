import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();
const LANGUAGE_STORAGE_KEY = 'krishoksheba_lang';
const SUPPORTED_LANGUAGES = ['bn', 'en'];

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'bn';
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return SUPPORTED_LANGUAGES.includes(saved) ? saved : 'bn';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLanguage);

  const setLang = (nextLang) => {
    setLangState(SUPPORTED_LANGUAGES.includes(nextLang) ? nextLang : 'bn');
  };

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
    document.documentElement.dataset.language = lang;
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => prev === 'bn' ? 'en' : 'bn');
  };

  return (
    <LanguageContext.Provider value={{ lang, language: lang, setLang, setLanguage: setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
