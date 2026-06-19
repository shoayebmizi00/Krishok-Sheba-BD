import { useLanguage } from '@/lib/LanguageContext';
import translations from '@/lib/translations';

export function useTranslation() {
  const { lang } = useLanguage();
  return (key) => translations[lang]?.[key] || translations.en?.[key] || key;
}