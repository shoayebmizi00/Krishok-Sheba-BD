import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Truck, CalendarCheck, Route } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import StatCard from '@/components/dashboard/StatCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function TransportOverview() {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiClient.entities.Vehicle.filter({ owner_id: user.id }),
      apiClient.entities.TransportBooking.filter({ provider_id: user.id })
    ]).then(([vehicles, bookings]) => setData({ vehicles, bookings }));
  }, [user]);

  if (!data) return <LoadingSpinner />;
  const active = data.bookings.filter((booking) => ['confirmed', 'in_transit'].includes(booking.status)).length;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl">Welcome, {user?.full_name || 'Provider'}!</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Vehicles" value={data.vehicles.length} icon={Truck} />
        <StatCard label="Total Bookings" value={data.bookings.length} icon={CalendarCheck} />
        <StatCard label="Active Trips" value={active} icon={Route} />
      </div>
    </div>
  );
}
