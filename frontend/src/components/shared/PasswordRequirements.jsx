import React from 'react';
import { Check, X } from 'lucide-react';
import { PASSWORD_RULES, getPasswordChecks } from '@/utils/authValidation';
import { useTranslation } from '@/hooks/useTranslation';

export default function PasswordRequirements({ password }) {
  const t = useTranslation();
  const checks = getPasswordChecks(password);

  return (
    <div className="space-y-1.5 rounded-md border border-border bg-muted/30 p-3 text-sm" aria-live="polite">
      <p className="font-medium text-foreground">{t('validation.passwordRequirements')}</p>
      <ul className="space-y-1">
        {PASSWORD_RULES.map(({ key }) => {
          const complete = checks[key];
          const Icon = complete ? Check : X;
          return (
            <li key={key} className={`flex items-center gap-2 ${complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t(`validation.passwordRule.${key}`)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
