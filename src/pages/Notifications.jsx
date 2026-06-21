import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Bell, Check, Gavel, Package, Truck, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/constants';

const TYPE_ICONS = { bid: Gavel, order: Package, delivery: Truck, notice: Megaphone, system: Bell };

export default function Notifications() {
  const { user } = useOutletContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const data = await apiClient.entities.Notification.filter({ user_id: user.id }, '-created_date');
      setNotifications(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const markRead = async (id) => {
    await apiClient.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><LoadingSpinner /></div>;
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <EmptyState icon={Bell} title="Login required" description="Please login to view your notifications." />
        <Button asChild className="mt-4"><Link to="/login">লগইন করুন</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">নোটিফিকেশন</h1>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const IconComp = TYPE_ICONS[n.type] || Bell;
            return (
              <div key={n.id} className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${n.is_read ? 'border-border bg-card' : 'border-primary/20 bg-primary/5'}`}>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <IconComp className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground">{n.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(n.created_date)}</p>
                </div>
                {!n.is_read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(n.id)} className="shrink-0">
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
