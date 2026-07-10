import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sprout, ChevronDown, User, LogOut, LayoutDashboard, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationBell from '@/components/shared/NotificationBell';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { cn } from '@/lib/utils';

const navKeys = ["home", "marketplace", "equipment", "transport", "marketPrices", "notices"];
const navPaths = ["/", "/marketplace", "/equipment", "/transport", "/market-prices", "/notices"];

export default function Navbar({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const t = useTranslation();
  const { logout } = useAuth();
  const { lang, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    const role = user.role || 'farmer';
    if (role === 'admin') return '/admin';
    if (role === 'buyer') return '/buyer-dashboard';
    if (role === 'equipment_owner') return '/equipment-owner-dashboard';
    if (role === 'transport_provider') return '/transport-dashboard';
    return '/farmer-dashboard';
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Sprout className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="font-heading font-bold text-lg text-foreground leading-none">{t('appNameShort')}</span>
              <span className="text-xs text-primary font-semibold ml-1">{t('appNameSuffix')}</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navKeys.map((key, i) => (
              <Link
                key={navPaths[i]}
                to={navPaths[i]}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === navPaths[i]
                    ? 'text-primary bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t(key)}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <>
                <Link to="/messages" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </Link>
                <NotificationBell user={user} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="relative z-10 inline-flex h-10 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={t('profileMenu')}
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">{user.full_name || t('common.user')}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
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
                      <Link to={getDashboardPath()} className="flex items-center gap-2 px-3 py-2.5">
                        <LayoutDashboard className="w-4 h-4" /> {t('dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 px-3 py-2.5">
                        <User className="w-4 h-4" /> {t('profile.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 text-red-600 dark:text-red-400">
                      <LogOut className="w-4 h-4" /> {t('profile.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">{t('login')}</Link>
                </Button>
                <Button asChild size="sm" className="relative z-10 bg-primary hover:bg-primary/90">
                  <Link to="/register">{t('register')}</Link>
                </Button>
              </div>
            )}

            {/* Mobile Toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-muted-foreground">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <div className="px-4 py-3 space-y-1">
            {navKeys.map((key, i) => (
              <Link
                key={navPaths[i]}
                to={navPaths[i]}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-md text-sm font-medium ${
                  location.pathname === navPaths[i]
                    ? 'text-primary bg-secondary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {t(key)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
