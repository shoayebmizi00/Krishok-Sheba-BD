import React from 'react';
import { LogOut, Menu, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import NotificationBell from '@/components/shared/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BackButton from '@/components/shared/BackButton';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';

export default function DashboardHeader({ title, setMobileOpen, user }) {
  const { logout } = useAuth();
  const t = useTranslation();
  const location = useLocation();
  const isSubpage = location.pathname.split('/').filter(Boolean).length > 1;
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
        <LanguageToggle />
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <div className="flex items-center justify-between gap-2">
                <span>{t('settings.language')}</span>
                <LanguageToggle showLabel />
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <div className="flex items-center justify-between gap-2">
                <span>{t('settings.darkMode')}</span>
                <ThemeToggle showLabel />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`${notificationLink.replace('/notifications', '/profile')}`}>
                <User className="mr-2 h-4 w-4" /> {t('profile')}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
