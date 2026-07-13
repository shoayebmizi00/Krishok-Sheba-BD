import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import PasswordInput from '@/components/shared/PasswordInput';
import PasswordRequirements from '@/components/shared/PasswordRequirements';
import AuthLayout from "@/components/AuthLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { getAuthErrorMessage, isStrongPassword } from '@/utils/authValidation';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError(t('validation.passwordMismatch'));
      return;
    }
    if (!isStrongPassword(newPassword)) { setError(t('validation.passwordRequirements')); return; }
    setLoading(true);
    try {
      await apiClient.auth.resetPassword(resetToken, newPassword);
      window.setTimeout(() => window.location.assign('/login'), 800);
    } catch (err) {
      setError(getAuthErrorMessage(err, t, 'auth.passwordUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title={t('auth.invalidResetLink')}
        subtitle={t('auth.invalidResetLinkDesc')}
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            {t('auth.requestNewLink')}
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          {t('auth.incompleteResetLink')}
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title={t('setNewPassword')}
      subtitle={t('enterNewPassword')}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t('newPassword')}</Label>
          <PasswordInput
              id="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          <PasswordRequirements password={newPassword} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t('confirmPassword')}</Label>
          <PasswordInput
              id="confirm"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('updating')}
            </>
          ) : (
            t('updatePassword')
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
