import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import translations from '@/translations';

function getNestedValue(source, key) {
  return key.split('.').reduce((value, part) => value?.[part], source);
}

function humanizeKey(key) {
  return key
    .split('.')
    .pop()
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (value) => value.toUpperCase());
}

export function useTranslation() {
  const { lang, setLang, setLanguage, toggleLang } = useLanguage();

  return useMemo(() => {
    const translate = (key, fallback) => {
      const value = getNestedValue(translations[lang], key) ?? translations[lang]?.[key];
      const englishValue = getNestedValue(translations.en, key) ?? translations.en?.[key];

      if (value) return value;

      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing translation key "${key}" for "${lang}"`);
      }

      return fallback ?? englishValue ?? humanizeKey(key);
    };

    translate.t = translate;
    translate.language = lang;
    translate.lang = lang;
    translate.setLanguage = setLanguage || setLang;
    translate.setLang = setLang;
    translate.toggleLanguage = toggleLang;
    translate.toggleLang = toggleLang;
    translate.translateStatus = (status) => translate(`status.${status}`, status);

    return translate;
  }, [lang, setLang, setLanguage, toggleLang]);
}

export default useTranslation;
