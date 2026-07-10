import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, Loader2, User } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AuthLayout from '@/components/AuthLayout';
import { useTranslation } from '@/hooks/useTranslation';
import { dashboardPathForRole } from '@/routes/roleRoutes';
import { useToast } from '@/components/ui/use-toast';

const registrationRoles = [
  ['farmer', 'roles.farmer'],
  ['buyer', 'roles.buyer'],
  ['equipment_owner', 'roles.equipmentOwner'],
  ['transport_provider', 'roles.transportProvider']
];

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'farmer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = useTranslation();
  const { toast } = useToast();

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError(t('validation.passwordMismatch'));
      return;
    }
    if (!form.full_name.trim()) {
      setError(t('validation.fullNameRequired'));
      return;
    }
    if (form.password.length < 8) {
      setError(t('validation.passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      const result = await apiClient.auth.register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role
      });
      toast({ title: t('auth.registerSuccess') });
      window.setTimeout(() => window.location.assign(dashboardPathForRole(result.user.role)), 200);
    } catch (err) {
      setError(t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title={t('createAccount')}
      subtitle={t('joinPlatform')}
      footer={
        <>
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">{t('logIn')}</Link>
        </>
      }
    >
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">{t('auth.fullName')}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="full_name" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t('auth.accountType')}</Label>
          <Select value={form.role} onValueChange={(value) => update('role', value)}>
            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
            <SelectContent>
              {registrationRoles.map(([value, labelKey]) => <SelectItem key={value} value={value}>{t(labelKey)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('password')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t('confirmPassword')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="confirm" type="password" minLength={8} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('creating')}</> : t('createAccount')}
        </Button>
      </form>
    </AuthLayout>
  );
}
