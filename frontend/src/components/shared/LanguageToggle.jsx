import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';

export default function LanguageToggle({ showLabel = false }) {
  const { lang, toggleLang } = useLanguage();
  const t = useTranslation();
  const label = lang === 'bn' ? t('settings.english') : t('settings.bangla');

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? 'sm' : 'icon'}
      onClick={toggleLang}
      title={label}
      aria-label={label}
      className={showLabel ? 'gap-2' : ''}
    >
      <Languages className="h-4 w-4" />
      {showLabel && <span>{label}</span>}
    </Button>
  );
}
