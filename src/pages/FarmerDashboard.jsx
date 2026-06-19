import React, { useState } from 'react';
import { Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { LayoutDashboard, Sprout, Plus, Gavel, Package, Wrench, Truck, History, Clock, Bell, MessageSquare, UserCircle } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useTranslation } from '@/lib/useTranslation';

export default function FarmerDashboard() {
  const { user } = useOutletContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const t = useTranslation();

  const SIDEBAR_LINKS = [
    { icon: LayoutDashboard, label: t('overview'), path: "/farmer-dashboard" },
    { icon: Sprout, label: t('myListings'), path: "/farmer-dashboard/listings" },
    { icon: Plus, label: t('addListing'), path: "/farmer-dashboard/add-listing" },
    { icon: Gavel, label: t('bids'), path: "/farmer-dashboard/bids" },
    { icon: Package, label: t('orders'), path: "/farmer-dashboard/orders" },
    { icon: Wrench, label: t('equipmentBookings'), path: "/farmer-dashboard/equipment-bookings" },
    { icon: Truck, label: t('transportRequests'), path: "/farmer-dashboard/transport-requests" },
    { icon: History, label: t('transactions'), path: "/farmer-dashboard/transactions" },
    { icon: Clock, label: t('harvestReminders'), path: "/farmer-dashboard/harvest-reminders" },
    { icon: Bell, label: t('notifications'), path: "/notifications" },
    { icon: MessageSquare, label: t('messages'), path: "/messages" },
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