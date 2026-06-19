import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Calendar, Clock, AlertTriangle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/constants';

export default function HarvestReminders() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const data = await apiClient.entities.CropListing.filter({ farmer_id: user.id, status: 'active' }, 'expected_harvest_date');
      setListings(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const daysUntil = (dateStr) => {
    if (!dateStr) return Infinity;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  };

  const getStatus = (days) => {
    if (days < 0) return { color: 'text-red-500', icon: AlertTriangle, label: 'Overdue' };
    if (days === 0) return { color: 'text-red-500', icon: AlertTriangle, label: 'Today!' };
    if (days <= 3) return { color: 'text-yellow-500', icon: Clock, label: `${days} day${days > 1 ? 's' : ''} left` };
    if (days <= 7) return { color: 'text-orange-400', icon: Clock, label: `${days} days left` };
    if (days <= 30) return { color: 'text-green-500', icon: Calendar, label: `${days} days left` };
    return { color: 'text-blue-400', icon: Calendar, label: `${days} days left` };
  };

  const handleSetReminder = async (listing) => {
    setReminding(prev => ({ ...prev, [listing.id]: true }));
    await apiClient.entities.Notification.create({
      user_id: user.id,
      title: `🌾 Harvest Reminder: ${listing.crop_name}`,
      message: `Your ${listing.crop_name} (${listing.quantity} ${listing.unit || 'kg'}) in ${listing.district} is ready for harvest on ${formatDate(listing.expected_harvest_date)}. Prepare for harvesting!`,
      type: 'system',
      is_read: false
    });
    toast({ title: "Reminder set!", description: "You'll be notified before harvest" });
    setReminding(prev => ({ ...prev, [listing.id]: false }));
  };

  if (loading) return <LoadingSpinner />;

  const upcoming = listings
    .filter(l => l.expected_harvest_date)
    .sort((a, b) => daysUntil(a.expected_harvest_date) - daysUntil(b.expected_harvest_date));
  const overdue = upcoming.filter(l => daysUntil(l.expected_harvest_date) < 0);
  const near = upcoming.filter(l => daysUntil(l.expected_harvest_date) >= 0 && daysUntil(l.expected_harvest_date) <= 7);
  const future = upcoming.filter(l => daysUntil(l.expected_harvest_date) > 7);

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">Harvest Reminders</h2>

      {upcoming.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No harvest dates set"
          description="Add harvest dates to your crop listings to get reminders"
        />
      ) : (
        <>
          {overdue.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-red-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Overdue ({overdue.length})
              </h3>
              {renderList(overdue)}
            </div>
          )}

          {near.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-yellow-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Harvest This Week ({near.length})
              </h3>
              {renderList(near)}
            </div>
          )}

          {future.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-green-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Upcoming ({future.length})
              </h3>
              {renderList(future)}
            </div>
          )}
        </>
      )}
    </div>
  );

  function renderList(items) {
    return items.map(listing => {
      const days = daysUntil(listing.expected_harvest_date);
      const { color, icon: IconComp, label } = getStatus(days);
      return (
        <div key={listing.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${days < 0 ? 'bg-red-100' : days <= 7 ? 'bg-yellow-100' : 'bg-green-100'}`}>
              <IconComp className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{listing.crop_name}</h3>
              <p className="text-xs text-muted-foreground">{listing.district} · {listing.quantity} {listing.unit || 'kg'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`text-sm font-semibold ${color}`}>{label}</p>
              <p className="text-xs text-muted-foreground">{formatDate(listing.expected_harvest_date)}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSetReminder(listing)}
              disabled={reminding[listing.id]}
              className="gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              {reminding[listing.id] ? '...' : 'Remind'}
            </Button>
          </div>
        </div>
      );
    });
  }
}
