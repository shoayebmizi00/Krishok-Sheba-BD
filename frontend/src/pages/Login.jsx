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
import { getAuthErrorMessage } from '@/utils/authValidation';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslation();
  const { toast } = useToast();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await apiClient.auth.login(email, password);
      toast({ title: t('auth.loginSuccess') });
      window.setTimeout(() => window.location.assign(dashboardPathForRole(result.user.role)), 200);
    } catch (err) {
      setError(getAuthErrorMessage(err, t, 'auth.invalidCredentials'));
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
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <p>{error}</p>
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
    </AuthLayout>
  );
}
