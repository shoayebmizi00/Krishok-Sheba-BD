import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useTranslation } from "@/lib/useTranslation";
import { useLanguage } from "@/lib/LanguageContext";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslation();
  const { lang } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("দুটি পাসওয়ার্ড একই নয়");
      return;
    }
    setLoading(true);
    try {
      await apiClient.auth.resetPassword(resetToken, newPassword);
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "পাসওয়ার্ড পরিবর্তন করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title={lang === 'bn' ? 'অবৈধ রিসেট লিংক' : 'Invalid reset link'}
        subtitle={lang === 'bn' ? 'এই পাসওয়ার্ড রিসেট লিংকটি অনুপস্থিত বা অবৈধ' : 'This password reset link is missing or invalid'}
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            {lang === 'bn' ? 'নতুন লিংক অনুরোধ করুন' : 'Request a new link'}
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          {lang === 'bn' ? 'আপনার ব্যবহৃত লিংকটি অসম্পূর্ণ মনে হচ্ছে। অনুগ্রহ করে নতুন পাসওয়ার্ড রিসেট ইমেইল অনুরোধ করুন।' : 'The link you used appears to be incomplete. Please request a new password reset email.'}
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
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t('confirmPassword')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
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
