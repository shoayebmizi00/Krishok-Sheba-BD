import React, { useEffect, useState } from 'react';
import { Banknote, CalendarDays, CircleDollarSign, Clock3, Package, Sprout, Truck, UserRound, Users, Wrench } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiClient } from '@/api/apiClient';
import StatCard from '@/components/dashboard/StatCard';
import TransactionSkeleton from '@/components/payments/TransactionSkeleton';
import { ROLE_LABELS, formatCurrency } from '@/utils/constants';

const COLORS = ['#16A34A', '#F59E0B', '#3B82F6', '#8B5CF6', '#F97316'];
export default function AdminOverview() {
  const [data, setData] = useState(null);
  useEffect(() => { apiClient.dashboard.adminSummary().then(setData).catch(() => setData({ roles: [], months: [] })); }, []);
  if (!data) return <TransactionSkeleton />;
  const roles = (data.roles || []).map((item) => ({ ...item, name: ROLE_LABELS[item.name] || item.name }));
  const cards = [
    [Users, 'মোট ব্যবহারকারী', data.users], [UserRound, 'মোট কৃষক', data.farmers], [UserRound, 'মোট ক্রেতা', data.buyers],
    [Wrench, 'যন্ত্রপাতির মালিক', data.equipmentOwners], [Truck, 'পরিবহন মালিক', data.transportOwners],
    [Sprout, 'ফসলের তালিকা', data.listings], [Package, 'মোট অর্ডার', data.orders], [CalendarDays, 'মোট বুকিং', data.bookings],
    [Banknote, 'মোট লেনদেন', data.transactions], [CircleDollarSign, 'যাচাইকৃত আয়', formatCurrency(data.revenue || 0)],
    [Clock3, 'অপেক্ষমাণ অনুমোদন', data.pending], [Sprout, 'বিক্রি শেষ', data.sold_out]
  ];
  return (
    <div className="space-y-6">
      <div><h2 className="font-heading text-xl font-bold">প্রশাসক ড্যাশবোর্ড</h2><p className="text-sm text-muted-foreground">একটি হালকা API থেকে বর্তমান কার্যক্রমের সারসংক্ষেপ</p></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">{cards.map(([icon, label, value], i) => <StatCard key={label} icon={icon} label={label} value={typeof value === 'number' ? value.toLocaleString('bn-BD') : value || 0} color={i % 2 ? 'text-blue-700' : 'text-primary'} bgColor={i % 2 ? 'bg-blue-100' : 'bg-primary/10'} />)}</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5"><h3 className="mb-4 font-semibold">মাসিক অর্ডার</h3><div className="h-72"><ResponsiveContainer><BarChart data={data.months || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="orders" fill="#16A34A" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        <div className="rounded-2xl border bg-card p-5"><h3 className="mb-4 font-semibold">ভূমিকা অনুযায়ী ব্যবহারকারী</h3><div className="h-72"><ResponsiveContainer><PieChart><Pie data={roles} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} label>{roles.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
      </div>
    </div>
  );
}
