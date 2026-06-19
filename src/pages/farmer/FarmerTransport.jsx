import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Truck } from 'lucide-react';
import AddToCalendar from '@/components/shared/AddToCalendar';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';
import { useTranslation } from '@/lib/useTranslation';

export default function FarmerTransport() {
  const { user } = useOutletContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslation();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const data = await apiClient.entities.TransportBooking.filter({ farmer_id: user.id }, '-created_date');
      setBookings(data);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">{t('transportRequests')}</h2>

      {bookings.length === 0 ? (
        <EmptyState icon={Truck} title={t('noTransportRequests')} description={t('noTransportRequestsDesc')} />
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground capitalize">{(b.vehicle_type || '').replace('_', ' ')}</h3>
                  <p className="text-xs text-muted-foreground">{b.pickup_location} → {b.delivery_location}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(b.pickup_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <AddToCalendar 
                    title={`Transport: ${b.pickup_location} → ${b.delivery_location}`}
                    startDate={b.pickup_date}
                    endDate={b.pickup_date}
                    location={`${b.pickup_location} → ${b.delivery_location}`}
                    description={`Vehicle: ${b.vehicle_type || 'N/A'}\nCost: ৳${b.estimated_cost}\nStatus: ${b.status}`}
                  />
                  <span className="font-bold text-primary">{formatCurrency(b.estimated_cost)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
