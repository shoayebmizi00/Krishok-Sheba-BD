import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('bn');

  useEffect(() => {
    localStorage.setItem('krishoksheba_lang', lang);
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => prev === 'bn' ? 'en' : 'bn');
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
