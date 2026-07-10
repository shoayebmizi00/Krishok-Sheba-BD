import React from 'react';
import { LogOut, Menu, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import NotificationBell from '@/components/shared/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import BackButton from '@/components/shared/BackButton';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export default function DashboardHeader({ title, setMobileOpen, user }) {
  const { logout } = useAuth();
  const t = useTranslation();
  const { lang, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isSubpage = location.pathname.split('/').filter(Boolean).length > 1;
  const isDark = theme === 'dark';
  const notificationLink = user?.role === 'buyer'
    ? '/buyer-dashboard/notifications'
    : user?.role === 'equipment_owner'
      ? '/equipment-owner-dashboard/notifications'
      : user?.role === 'transport_provider'
        ? '/transport-dashboard/notifications'
        : '/farmer-dashboard/notifications';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 hover:bg-muted lg:hidden">
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          {isSubpage && <BackButton className="h-5 text-xs" />}
          <h1 className="font-heading font-semibold text-foreground">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <NotificationBell user={user} link={notificationLink} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-semibold text-primary">{(user?.full_name || t('common.user'))[0]}</span>
              </div>
              <span className="hidden text-sm sm:inline">{user?.full_name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[260px] bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <div className="px-3 py-2.5">
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('settings.language')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['bn', t('settings.bangla')],
                  ['en', t('settings.english')],
                ].map(([code, label]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                      lang === code
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('settings.darkMode')}
              </span>
              <Switch
                checked={isDark}
                onCheckedChange={toggleTheme}
                aria-label={t(isDark ? 'settings.lightMode' : 'settings.darkMode')}
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`${notificationLink.replace('/notifications', '/profile')}`} className="px-3 py-2.5">
                <User className="mr-2 h-4 w-4" /> {t('profile.profile')}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="px-3 py-2.5 text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" /> {t('profile.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
