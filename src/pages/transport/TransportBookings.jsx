import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import { Truck } from 'lucide-react';
import { formatDate } from '@/lib/constants';

export default function TransportBookings() {
  const { user } = useOutletContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setBookings(await apiClient.entities.TransportBooking.filter({ provider_id: user.id }, '-created_date'));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const updateStatus = async (id, status) => {
    await apiClient.entities.TransportBooking.update(id, { status });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <h2 className="font-heading font-bold text-xl">পরিবহন বুকিং</h2>
      {!bookings.length ? <EmptyState icon={Truck} title="কোনো বুকিং নেই" description="গ্রাহকের পরিবহন অনুরোধ এখানে দেখা যাবে" /> : bookings.map((booking) => (
        <div key={booking.id} className="border rounded-lg bg-card p-4">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h3 className="font-semibold">{booking.pickup_location} থেকে {booking.delivery_location}</h3>
              <p className="text-sm text-muted-foreground">{booking.farmer_name} · {formatDate(booking.pickup_date)}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
          {booking.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => updateStatus(booking.id, 'confirmed')}>নিশ্চিত করুন</Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, 'cancelled')}>প্রত্যাখ্যান করুন</Button>
            </div>
          )}
          {booking.status === 'confirmed' && <Button size="sm" className="mt-3" onClick={() => updateStatus(booking.id, 'in_transit')}>যাত্রা শুরু করুন</Button>}
          {booking.status === 'in_transit' && <Button size="sm" className="mt-3" onClick={() => updateStatus(booking.id, 'delivered')}>পৌঁছেছে চিহ্নিত করুন</Button>}
        </div>
      ))}
    </div>
  );
}
