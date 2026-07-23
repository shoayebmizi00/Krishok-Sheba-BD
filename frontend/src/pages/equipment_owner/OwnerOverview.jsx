import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Wrench, Calendar, Banknote, CheckCircle2, Bell, MessageSquare } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency } from '@/utils/constants';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function OwnerOverview() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setStats(await apiClient.dashboard.equipmentOwnerSummary());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="rounded-xl border border-destructive/30 p-6 text-center text-destructive">Dashboard data could not be loaded. Please try again.</p>;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">Welcome, {user?.full_name || 'Owner'}! 🚜</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Wrench} label="My Equipment" value={stats.equipment} color="text-orange-600" bgColor="bg-orange-100" />
        <StatCard icon={Calendar} label="Bookings" value={stats.bookings} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard icon={CheckCircle2} label="Active Bookings" value={stats.active_bookings} color="text-green-600" bgColor="bg-green-100" />
        <StatCard icon={Banknote} label="Revenue" value={formatCurrency(stats.revenue)} color="text-primary" bgColor="bg-primary/10" />
        <StatCard icon={Bell} label="Unread Notifications" value={stats.unread_notifications} color="text-yellow-600" bgColor="bg-yellow-100" />
        <StatCard icon={MessageSquare} label="Unread Messages" value={stats.unread_messages} color="text-cyan-600" bgColor="bg-cyan-100" />
      </div>
    </div>
  );
}
