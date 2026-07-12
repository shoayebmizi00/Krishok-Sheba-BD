import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Loader2 } from "lucide-react";
import PasswordInput from '@/components/shared/PasswordInput';
import AuthLayout from "@/components/AuthLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { dashboardPathForRole } from '@/routes/roleRoutes';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslation();
  const { toast } = useToast();
  const demoAccounts = [
    ['roles.admin', 'admin@example.com'],
    ['roles.farmer', 'farmer@example.com'],
    ['roles.buyer', 'buyer@example.com'],
    ['roles.equipmentOwner', 'equipment@example.com'],
    ['roles.transportProvider', 'transport@example.com']
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await apiClient.auth.login(email, password);
      toast({ title: t('auth.loginSuccess') });
      window.setTimeout(() => window.location.assign(dashboardPathForRole(result.user.role)), 200);
    } catch (err) {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title={t('welcomeBack')}
      subtitle={t('loginToAccount')}
      footer={
        <>
          {t('noAccount')}{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            {t('createOne')}
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('password')}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
          <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('loggingIn')}
            </>
          ) : (
            t('logIn')
          )}
        </Button>
      </form>
      {import.meta.env.DEV && (
        <div className="mt-5 pt-5 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">{t('auth.demoAccounts')}</p>
          <div className="flex flex-wrap gap-2">
            {demoAccounts.map(([labelKey, demoEmail]) => (
              <Button
                key={demoEmail}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail(demoEmail);
                  setPassword('123456');
                }}
              >
                {t(labelKey)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
