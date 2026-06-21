import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Users, Sprout, Package, Banknote, ShoppingCart, Wrench } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency } from '@/lib/constants';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const MONTHLY_DATA = [
  { month: "Jan", revenue: 120000, orders: 45 },
  { month: "Feb", revenue: 180000, orders: 62 },
  { month: "Mar", revenue: 220000, orders: 78 },
  { month: "Apr", revenue: 150000, orders: 55 },
  { month: "May", revenue: 280000, orders: 95 },
  { month: "Jun", revenue: 350000, orders: 120 },
];

const PIE_COLORS = ['#16A34A', '#FACC15', '#3B82F6', '#F97316', '#8B5CF6'];

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, listings: 0, orders: 0, revenue: 0, equipment: 0, vehicles: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [users, listings, orders, equipment, vehicles, transactions] = await Promise.all([
        apiClient.entities.User.list(),
        apiClient.entities.CropListing.list(),
        apiClient.entities.Order.list(),
        apiClient.entities.Equipment.list(),
        apiClient.entities.Vehicle.list(),
        apiClient.entities.Transaction.list()
      ]);
      const revenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      setStats({
        users: users.length, listings: listings.length, orders: orders.length,
        revenue, equipment: equipment.length, vehicles: vehicles.length
      });
      setLoading(false);
    };
    load();
  }, []);

  const roleData = [
    { name: "Farmers", value: 45 },
    { name: "Buyers", value: 30 },
    { name: "Equipment", value: 12 },
    { name: "Transport", value: 8 },
    { name: "Admin", value: 5 },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">প্রশাসক ড্যাশবোর্ড</h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Users" value={stats.users} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard icon={Sprout} label="Listings" value={stats.listings} color="text-green-600" bgColor="bg-green-100" />
        <StatCard icon={Package} label="Orders" value={stats.orders} color="text-purple-600" bgColor="bg-purple-100" />
        <StatCard icon={Banknote} label="Revenue" value={formatCurrency(stats.revenue)} color="text-primary" bgColor="bg-primary/10" />
        <StatCard icon={Wrench} label="Equipment" value={stats.equipment} color="text-orange-600" bgColor="bg-orange-100" />
        <StatCard icon={ShoppingCart} label="Vehicles" value={stats.vehicles} color="text-indigo-600" bgColor="bg-indigo-100" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4">মাসিক আয়</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="hsl(142, 72%, 29%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4">ব্যবহারকারীর বণ্টন</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {roleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="font-heading font-semibold text-foreground mb-4">অর্ডারের প্রবণতা</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="hsl(142, 72%, 29%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
