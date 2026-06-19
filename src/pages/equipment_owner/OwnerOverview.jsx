import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Wrench, Calendar, Banknote } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency } from '@/lib/constants';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function OwnerOverview() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState({ equipment: 0, bookings: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [equipment, bookings] = await Promise.all([
        apiClient.entities.Equipment.filter({ owner_id: user.id }),
        apiClient.entities.EquipmentBooking.filter({ owner_id: user.id })
      ]);
      const revenue = bookings.reduce((sum, b) => sum + (b.total_cost || 0), 0);
      setStats({ equipment: equipment.length, bookings: bookings.length, revenue });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">Welcome, {user?.full_name || 'Owner'}! 🚜</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Wrench} label="My Equipment" value={stats.equipment} color="text-orange-600" bgColor="bg-orange-100" />
        <StatCard icon={Calendar} label="Bookings" value={stats.bookings} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard icon={Banknote} label="Revenue" value={formatCurrency(stats.revenue)} color="text-primary" bgColor="bg-primary/10" />
      </div>
    </div>
  );
}
