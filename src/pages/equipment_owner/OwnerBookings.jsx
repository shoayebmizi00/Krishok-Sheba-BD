import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Calendar, Check, X } from 'lucide-react';
import AddToCalendar from '@/components/shared/AddToCalendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';
import { useTranslation } from '@/lib/useTranslation';

export default function OwnerBookings() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslation();

  const load = async () => {
    if (!user) return;
    const data = await apiClient.entities.EquipmentBooking.filter({ owner_id: user.id }, '-created_date');
    setBookings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const updateStatus = async (id, status) => {
    await apiClient.entities.EquipmentBooking.update(id, { status });
    toast({ title: status === 'confirmed' ? t('bookingConfirmed') : t('bookingCancelled') });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">{t('bookings')}</h2>

      {bookings.length === 0 ? (
        <EmptyState icon={Calendar} title={t('noBookings')} description={t('noBookingsDesc')} />
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">{b.equipment_name}</h3>
                  <p className="text-sm text-muted-foreground">by {b.farmer_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(b.start_date)} — {formatDate(b.end_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary">{formatCurrency(b.total_cost)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                {b.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(b.id, 'confirmed')} className="bg-green-600 hover:bg-green-700 gap-1">
                      <Check className="w-3.5 h-3.5" /> Confirm
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, 'cancelled')} className="text-destructive gap-1">
                      <X className="w-3.5 h-3.5" /> Decline
                    </Button>
                  </>
                )}
                <div className="ml-auto">
                  <AddToCalendar 
                    title={`Equipment Booking: ${b.equipment_name}`}
                    startDate={b.start_date}
                    endDate={b.end_date}
                    description={`Equipment: ${b.equipment_name}\nFarmer: ${b.farmer_name}\nStatus: ${b.status}\nTotal: ৳${b.total_cost}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
