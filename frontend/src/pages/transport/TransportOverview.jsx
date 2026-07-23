import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Truck, CalendarCheck, Route, Banknote, Bell, MessageSquare } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import StatCard from '@/components/dashboard/StatCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatCurrency } from '@/utils/constants';

export default function TransportOverview() {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiClient.dashboard.transportProviderSummary().then(setData).catch(() => setError(true));
  }, [user]);

  if (error) return <p className="rounded-xl border border-destructive/30 p-6 text-center text-destructive">Dashboard data could not be loaded. Please try again.</p>;
  if (!data) return <LoadingSpinner />;
  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl">Welcome, {user?.full_name || 'Provider'}!</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Vehicles" value={data.vehicles} icon={Truck} />
        <StatCard label="Total Bookings" value={data.bookings} icon={CalendarCheck} />
        <StatCard label="Active Trips" value={data.active_trips} icon={Route} />
        <StatCard label="Revenue" value={formatCurrency(data.revenue)} icon={Banknote} />
        <StatCard label="Unread Notifications" value={data.unread_notifications} icon={Bell} />
        <StatCard label="Unread Messages" value={data.unread_messages} icon={MessageSquare} />
      </div>
    </div>
  );
}
