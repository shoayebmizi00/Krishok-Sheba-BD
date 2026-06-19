import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Wrench } from 'lucide-react';
import AddToCalendar from '@/components/shared/AddToCalendar';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';
import { useTranslation } from '@/lib/useTranslation';

export default function FarmerEquipmentBookings() {
  const { user } = useOutletContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslation();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const data = await apiClient.entities.EquipmentBooking.filter({ farmer_id: user.id }, '-created_date');
      setBookings(data);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">{t('equipmentBookings')}</h2>

      {bookings.length === 0 ? (
        <EmptyState icon={Wrench} title={t('noEquipmentBookings')} description={t('noEquipmentBookingsDesc')} />
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-foreground">{b.equipment_name || 'Equipment'}</h3>
                <p className="text-xs text-muted-foreground">{formatDate(b.start_date)} — {formatDate(b.end_date)}</p>
              </div>
              <div className="flex items-center gap-3">
                  <AddToCalendar 
                    title={`Equipment Booking: ${b.equipment_name || 'Equipment'}`}
                    startDate={b.start_date}
                    endDate={b.end_date}
                    description={`Equipment: ${b.equipment_name}\nStatus: ${b.status}\nTotal: ৳${b.total_cost}`}
                  />
                  <span className="font-bold text-primary">{formatCurrency(b.total_cost)}</span>
                  <StatusBadge status={b.status} />
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
