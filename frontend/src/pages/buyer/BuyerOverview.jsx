import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { ShoppingCart, Package, Banknote, Clock } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency } from '@/utils/constants';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function BuyerOverview() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState({ orders: 0, pending: 0, totalSpent: 0, bids: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [orders, bids] = await Promise.all([
        apiClient.entities.Order.filter({ buyer_id: user.id }),
        apiClient.entities.Bid.filter({ buyer_id: user.id })
      ]);
      const pending = orders.filter(o => o.status === 'pending').length;
      const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      setStats({ orders: orders.length, pending, totalSpent, bids: bids.length });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Welcome, {user?.full_name || 'Buyer'}! 🛒</h2>
        <p className="text-sm text-muted-foreground mt-1">আপনার ক্রয় কার্যক্রমের সারসংক্ষেপ</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats.orders} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="text-yellow-600" bgColor="bg-yellow-100" />
        <StatCard icon={Banknote} label="Total Spent" value={formatCurrency(stats.totalSpent)} color="text-primary" bgColor="bg-primary/10" />
        <StatCard icon={Package} label="Active Bids" value={stats.bids} color="text-purple-600" bgColor="bg-purple-100" />
      </div>
    </div>
  );
}
