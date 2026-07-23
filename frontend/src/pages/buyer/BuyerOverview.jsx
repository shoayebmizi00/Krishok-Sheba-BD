import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { ShoppingCart, Package, Banknote, Clock, Bell, MessageSquare, Gavel } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency } from '@/utils/constants';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function BuyerOverview() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setStats(await apiClient.dashboard.buyerSummary());
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
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Welcome, {user?.full_name || 'Buyer'}! 🛒</h2>
        <p className="text-sm text-muted-foreground mt-1">আপনার ক্রয় কার্যক্রমের সারসংক্ষেপ</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats.orders} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard icon={Clock} label="Active Orders" value={stats.active_orders} color="text-yellow-600" bgColor="bg-yellow-100" />
        <StatCard icon={Package} label="Purchased Products" value={stats.purchased_products} color="text-green-600" bgColor="bg-green-100" />
        <StatCard icon={Banknote} label="Total Spent" value={formatCurrency(stats.total_spent)} color="text-primary" bgColor="bg-primary/10" />
        <StatCard icon={Gavel} label="Active Bids" value={stats.active_bids} color="text-purple-600" bgColor="bg-purple-100" />
        <StatCard icon={Bell} label="Unread Notifications" value={stats.unread_notifications} color="text-orange-600" bgColor="bg-orange-100" />
        <StatCard icon={MessageSquare} label="Unread Messages" value={stats.unread_messages} color="text-cyan-600" bgColor="bg-cyan-100" />
      </div>
    </div>
  );
}
