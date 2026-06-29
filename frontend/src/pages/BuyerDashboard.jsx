import React, { useState } from 'react';
import { Navigate, Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, History, Bell, UserCircle, Search, MessageSquare } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { dashboardPathForRole } from '@/routes/roleRoutes';

export default function BuyerDashboard() {
  const { user } = useOutletContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const t = useTranslation();
  if (user?.role !== 'buyer') return <Navigate to={dashboardPathForRole(user?.role)} replace />;

  const SIDEBAR_LINKS = [
    { icon: LayoutDashboard, label: t('overview'), path: "/buyer-dashboard" },
    { icon: Search, label: t('marketplace'), path: "/marketplace" },
    { icon: Package, label: t('orders'), path: "/buyer-dashboard/orders" },
    { icon: History, label: t('transactions'), path: "/buyer-dashboard/transactions" },
    { icon: MessageSquare, label: t('messages'), path: "/buyer-dashboard/messages" },
    { icon: Bell, label: t('notifications'), path: "/buyer-dashboard/notifications" },
    { icon: UserCircle, label: t('profile'), path: "/buyer-dashboard/profile" },
  ];

  const pageTitle = SIDEBAR_LINKS.find((link) => link.path === location.pathname || (link.path !== '/buyer-dashboard' && location.pathname.startsWith(`${link.path}/`)))?.label || t('overview');

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar links={SIDEBAR_LINKS} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title={pageTitle} setMobileOpen={setMobileOpen} user={user} />
        <div className="flex-1 p-4 sm:p-6">
          <Outlet context={{ user }} />
        </div>
      </div>
    </div>
  );
}
