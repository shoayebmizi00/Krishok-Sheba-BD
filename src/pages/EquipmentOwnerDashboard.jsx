import React, { useState } from 'react';
import { Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, Plus, Calendar, Bell, UserCircle, MessageSquare } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useTranslation } from '@/lib/useTranslation';

export default function EquipmentOwnerDashboard() {
  const { user } = useOutletContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const t = useTranslation();

  const SIDEBAR_LINKS = [
    { icon: LayoutDashboard, label: t('overview'), path: "/equipment-owner-dashboard" },
    { icon: Wrench, label: t('myEquipment'), path: "/equipment-owner-dashboard/equipment" },
    { icon: Plus, label: t('addEquipment'), path: "/equipment-owner-dashboard/add" },
    { icon: Calendar, label: t('bookings'), path: "/equipment-owner-dashboard/bookings" },
    { icon: MessageSquare, label: t('messages'), path: "/messages" },
    { icon: Bell, label: t('notifications'), path: "/notifications" },
    { icon: UserCircle, label: t('profile'), path: "/profile" },
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