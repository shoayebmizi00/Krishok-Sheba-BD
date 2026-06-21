import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sprout, ChevronDown, User, LogOut, LayoutDashboard, MessageSquare, Languages } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/lib/useTranslation';
import { useLanguage } from '@/lib/LanguageContext';
import NotificationBell from '@/components/shared/NotificationBell';

const navKeys = ["home", "marketplace", "equipment", "transport", "marketPrices", "notices"];
const navPaths = ["/", "/marketplace", "/equipment", "/transport", "/market-prices", "/notices"];

export default function Navbar({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const t = useTranslation();
  const { lang, toggleLang } = useLanguage();
  const { logout } = useAuth();

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
              <span className="font-heading font-bold text-lg text-foreground leading-none">KRISHOK-SHEBA</span>
              <span className="text-xs text-primary font-semibold ml-1">BD</span>
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
            {/* Language Toggle */}
            <button onClick={toggleLang} className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md" title={t('switchToEnglish')}>
              <Languages className="w-5 h-5" />
              <span className="sr-only">{lang === 'bn' ? t('switchToEnglish') : t('switchToBangla')}</span>
            </button>

            {user ? (
              <>
                <Link to="/messages" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </Link>
                <NotificationBell user={user} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">{user.full_name || 'User'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardPath()} className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" /> {t('dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" /> {t('profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive">
                      <LogOut className="w-4 h-4" /> {t('logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">{t('login')}</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">{t('register')}</Button>
                </Link>
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
