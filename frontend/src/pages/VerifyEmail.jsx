import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck, Loader2 } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { apiClient } from '@/api/apiClient';
import { useTranslation } from '@/hooks/useTranslation';

export default function VerifyEmail() {
  const [params] = useSearchParams(); const [status, setStatus] = useState('loading'); const t = useTranslation();
  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('invalid'); return; }
    apiClient.auth.verifyEmail(token).then(() => setStatus('success')).catch(() => setStatus('invalid'));
  }, [params]);
  return <AuthLayout icon={MailCheck} title={t('auth.verifyEmail')} subtitle={status === 'success' ? t('auth.emailVerified') : t('auth.verifyingEmail')}>
    <div className="text-center text-sm text-foreground">
      {status === 'loading' && <Loader2 className="mx-auto h-6 w-6 animate-spin" />}
      {status === 'invalid' && <p>{t('auth.invalidVerificationLink')}</p>}
      {status === 'success' && <Link className="text-primary hover:underline" to="/login">{t('backToLogin')}</Link>}
    </div>
  </AuthLayout>;
}
