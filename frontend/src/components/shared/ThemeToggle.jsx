import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';

export default function ThemeToggle({ showLabel = false }) {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslation();
  const isDark = theme === 'dark';
  const label = isDark ? t('settings.lightMode') : t('settings.darkMode');

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? 'sm' : 'icon'}
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={showLabel ? 'gap-2' : ''}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel && <span>{label}</span>}
    </Button>
  );
}
