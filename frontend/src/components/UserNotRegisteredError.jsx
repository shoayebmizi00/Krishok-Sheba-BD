import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const UserNotRegisteredError = () => {
  const t = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-200">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground">{t('access.limited')}</h1>
          <p className="mb-8 text-muted-foreground">
            {t('access.notRegistered')}
          </p>
          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p>{t('access.ifMistake')}</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{t('access.checkAccount')}</li>
              <li>{t('access.contactAdmin')}</li>
              <li>{t('access.logoutRetry')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
