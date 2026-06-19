import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Sprout, Package, Banknote, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency } from '@/lib/constants';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function FarmerOverview() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState({ listings: 0, orders: 0, pending: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [listings, orders, transactions] = await Promise.all([
        apiClient.entities.CropListing.filter({ farmer_id: user.id }),
        apiClient.entities.Order.filter({ seller_id: user.id }),
        apiClient.entities.Transaction.filter({ user_id: user.id })
      ]);
      const activeListings = listings.filter(l => l.status === 'active').length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      setStats({ listings: activeListings, orders: orders.length, pending: pendingOrders, revenue: totalRevenue });
      setRecentOrders(orders.slice(0, 5));
      setLoading(false);
    };
    load();
  }, [user]);

  const chartData = [
    { month: 'Jan', sales: 12000 }, { month: 'Feb', sales: 18000 },
    { month: 'Mar', sales: 22000 }, { month: 'Apr', sales: 15000 },
    { month: 'May', sales: 28000 }, { month: 'Jun', sales: 35000 },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">
          Welcome back, {user?.full_name || 'Farmer'}! 🌾
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Here's your farming dashboard overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Sprout} label="Active Listings" value={stats.listings} color="text-green-600" bgColor="bg-green-100" />
        <StatCard icon={Package} label="Total Orders" value={stats.orders} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard icon={Clock} label="Pending Orders" value={stats.pending} color="text-yellow-600" bgColor="bg-yellow-100" />
        <StatCard icon={Banknote} label="Revenue" value={formatCurrency(stats.revenue)} color="text-primary" bgColor="bg-primary/10" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-heading font-semibold text-foreground mb-4">Sales Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="sales" fill="hsl(142, 72%, 29%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-heading font-semibold text-foreground mb-4">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Buyer</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="py-3">{order.buyer_name || 'Buyer'}</td>
                    <td className="py-3 font-medium text-primary">{formatCurrency(order.total_amount)}</td>
                    <td className="py-3 capitalize">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
