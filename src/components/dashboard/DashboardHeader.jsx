import React from 'react';
import { LogOut, Menu, User } from 'lucide-react';
import NotificationBell from '@/components/shared/NotificationBell';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLocation } from 'react-router-dom';
import BackButton from '@/components/shared/BackButton';

export default function DashboardHeader({ title, setMobileOpen, user }) {
  const { logout } = useAuth();
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
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-card/95 backdrop-blur border-b border-border">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-muted">
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          {isSubpage && <BackButton className="h-5 text-xs" />}
          <h1 className="font-heading font-semibold text-foreground">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell user={user} link={notificationLink} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{(user?.full_name || 'ব্যবহারকারী')[0]}</span>
              </div>
              <span className="hidden text-sm sm:inline">{user?.full_name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild><a href={`${notificationLink.replace('/notifications', '/profile')}`}><User className="mr-2 h-4 w-4" /> প্রোফাইল</a></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-destructive"><LogOut className="mr-2 h-4 w-4" /> লগআউট</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
