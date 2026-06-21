import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, CalendarDays, CircleDollarSign, Clock3, Package, Sprout, Truck, UserRound, Users, Wrench } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiClient } from '@/api/apiClient';
import StatCard from '@/components/dashboard/StatCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ROLE_LABELS, formatCurrency } from '@/lib/constants';

const COLORS = ['#16A34A', '#F59E0B', '#3B82F6', '#8B5CF6', '#F97316'];

export default function AdminOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      apiClient.entities.User.list('-created_date', 500),
      apiClient.entities.CropListing.list('-created_date', 500),
      apiClient.entities.Order.list('-created_date', 500),
      apiClient.entities.Equipment.list('-created_date', 500),
      apiClient.entities.Vehicle.list('-created_date', 500),
      apiClient.entities.EquipmentBooking.list('-created_date', 500),
      apiClient.entities.TransportBooking.list('-created_date', 500),
      apiClient.entities.Transaction.list('-created_date', 500)
    ]).then(([users, listings, orders, equipment, vehicles, equipmentBookings, transportBookings, transactions]) => {
      setData({ users, listings, orders, equipment, vehicles, equipmentBookings, transportBookings, transactions });
    });
  }, []);

  const analytics = useMemo(() => {
    if (!data) return null;
    const roleCounts = Object.entries(data.users.reduce((counts, user) => {
      counts[user.role] = (counts[user.role] || 0) + 1;
      return counts;
    }, {})).map(([role, value]) => ({ name: ROLE_LABELS[role] || role, value }));
    const monthMap = {};
    data.orders.forEach((order) => {
      const date = new Date(order.created_date || order.created_at);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toLocaleDateString('bn-BD', { month: 'short', year: '2-digit' });
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    const monthlyOrders = Object.entries(monthMap).map(([month, orders]) => ({ month, orders })).slice(-6);
    const revenue = data.transactions.filter((item) => ['received', 'verified', 'completed'].includes(item.status)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return {
      roleCounts,
      monthlyOrders,
      revenue,
      farmers: data.users.filter((item) => item.role === 'farmer').length,
      buyers: data.users.filter((item) => item.role === 'buyer').length,
      equipmentOwners: data.users.filter((item) => item.role === 'equipment_owner').length,
      transportOwners: data.users.filter((item) => item.role === 'transport_provider').length,
      bookings: data.equipmentBookings.length + data.transportBookings.length,
      pending: data.listings.filter((item) => item.status === 'pending').length
        + data.equipment.filter((item) => item.approval_status === 'pending').length
        + data.vehicles.filter((item) => item.approval_status === 'pending').length,
      soldOut: data.listings.filter((item) => ['sold', 'sold_out'].includes(item.status)).length
    };
  }, [data]);

  if (!data || !analytics) return <LoadingSpinner />;

  const cards = [
    [Users, 'মোট ব্যবহারকারী', data.users.length, 'text-blue-600', 'bg-blue-100'],
    [UserRound, 'মোট কৃষক', analytics.farmers, 'text-green-600', 'bg-green-100'],
    [UserRound, 'মোট ক্রেতা', analytics.buyers, 'text-indigo-600', 'bg-indigo-100'],
    [Wrench, 'যন্ত্রপাতির মালিক', analytics.equipmentOwners, 'text-orange-600', 'bg-orange-100'],
    [Truck, 'পরিবহন মালিক', analytics.transportOwners, 'text-cyan-600', 'bg-cyan-100'],
    [Sprout, 'ফসলের তালিকা', data.listings.length, 'text-green-700', 'bg-green-100'],
    [Package, 'মোট অর্ডার', data.orders.length, 'text-purple-600', 'bg-purple-100'],
    [CalendarDays, 'মোট বুকিং', analytics.bookings, 'text-sky-600', 'bg-sky-100'],
    [Banknote, 'মোট লেনদেন', data.transactions.length, 'text-emerald-600', 'bg-emerald-100'],
    [CircleDollarSign, 'যাচাইকৃত আয়', formatCurrency(analytics.revenue), 'text-primary', 'bg-primary/10'],
    [Clock3, 'অপেক্ষমাণ অনুমোদন', analytics.pending, 'text-amber-600', 'bg-amber-100'],
    [Sprout, 'বিক্রি শেষ', analytics.soldOut, 'text-slate-600', 'bg-slate-100']
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="font-heading text-xl font-bold">প্রশাসক ড্যাশবোর্ড</h2><p className="text-sm text-muted-foreground">সিস্টেমের বর্তমান কার্যক্রম ও অনুমোদনের সারসংক্ষেপ</p></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(([icon, label, value, color, bgColor]) => <StatCard key={label} icon={icon} label={label} value={value} color={color} bgColor={bgColor} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">মাসিক অর্ডার</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.monthlyOrders}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="orders" name="অর্ডার" fill="#16A34A" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">ভূমিকা অনুযায়ী ব্যবহারকারী</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.roleCounts} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} label>{analytics.roleCounts.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
}
