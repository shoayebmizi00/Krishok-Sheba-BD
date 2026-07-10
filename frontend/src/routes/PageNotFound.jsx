import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

export default function PageNotFound() {
  const t = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-primary/25">404</p>
        <h1 className="mt-4 font-heading text-2xl font-bold">{t('pageNotFound')}</h1>
        <p className="mt-2 text-muted-foreground">{t('pageNotFoundDesc')}</p>
        <Button asChild className="mt-6"><Link to="/">{t('backHome')}</Link></Button>
      </div>
    </div>
  );
}
