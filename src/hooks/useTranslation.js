import { useLanguage } from '@/contexts/LanguageContext';
import translations from '@/translations/bn';

export function useTranslation() {
  const { lang } = useLanguage();
  return (key) => translations[lang]?.[key] || translations.en?.[key] || key;
}