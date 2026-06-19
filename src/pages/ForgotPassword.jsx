import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useTranslation } from "@/lib/useTranslation";
import { useLanguage } from "@/lib/LanguageContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const t = useTranslation();
  const { lang } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.auth.requestPasswordReset(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title={t('resetPassword')}
      subtitle={t('enterEmailForReset')}
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />{t('backToLogin')}
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-foreground text-center">
          {lang === 'bn' ? 'যদি এই ইমেইলের সাথে কোনো অ্যাকাউন্ট থাকে, আপনি শীঘ্রই পাসওয়ার্ড রিসেট লিংক পাবেন।' : "If an account exists with that email, you'll receive a password reset link shortly."}
        </p>
      ) : (
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
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('sending')}
              </>
            ) : (
              t('sendResetLink')
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
