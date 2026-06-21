import React, { useState } from 'react';
import { Navigate, Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { LayoutDashboard, Truck, Plus, Calendar, Bell, UserCircle, MessageSquare } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useTranslation } from '@/lib/useTranslation';

export default function TransportDashboard() {
  const { user } = useOutletContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const t = useTranslation();
  if (user?.role !== 'transport_provider') return <Navigate to="/" replace />;

  const SIDEBAR_LINKS = [
    { icon: LayoutDashboard, label: t('overview'), path: "/transport-dashboard" },
    { icon: Truck, label: t('myVehicles'), path: "/transport-dashboard/vehicles" },
    { icon: Plus, label: t('addVehicle'), path: "/transport-dashboard/add" },
    { icon: Calendar, label: t('bookings'), path: "/transport-dashboard/bookings" },
    { icon: MessageSquare, label: t('messages'), path: "/transport-dashboard/messages" },
    { icon: Bell, label: t('notifications'), path: "/transport-dashboard/notifications" },
    { icon: UserCircle, label: t('profile'), path: "/transport-dashboard/profile" },
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
