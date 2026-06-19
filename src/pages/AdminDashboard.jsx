import React, { useState } from 'react';
import { Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Sprout, Package, Wrench, Truck, Megaphone, Banknote } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useTranslation } from '@/lib/useTranslation';

export default function AdminDashboard() {
  const { user } = useOutletContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const t = useTranslation();

  const SIDEBAR_LINKS = [
    { icon: LayoutDashboard, label: t('overview'), path: "/admin" },
    { icon: Users, label: t('users'), path: "/admin/users" },
    { icon: Sprout, label: t('crops'), path: "/admin/crops" },
    { icon: Package, label: t('orders'), path: "/admin/orders" },
    { icon: Wrench, label: t('equipment'), path: "/admin/equipment" },
    { icon: Truck, label: t('transport'), path: "/admin/transport" },
    { icon: Megaphone, label: t('notices'), path: "/admin/notices" },
    { icon: Banknote, label: t('transactions'), path: "/admin/transactions" },
  ];

  const pageTitle = SIDEBAR_LINKS.find(l => l.path === location.pathname)?.label || t('overview');

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