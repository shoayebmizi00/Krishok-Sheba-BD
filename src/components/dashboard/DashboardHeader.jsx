import React from 'react';
import { Menu } from 'lucide-react';
import NotificationBell from '@/components/shared/NotificationBell';

export default function DashboardHeader({ title, setMobileOpen, user }) {
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
        <h1 className="font-heading font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell user={user} link={notificationLink} />
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">
            {(user?.full_name || 'U')[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
