import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Banknote, CheckCircle2, Clock, Package, Sprout, Truck, Wrench } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiClient } from '@/api/apiClient';
import StatCard from '@/components/dashboard/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import TransactionSkeleton from '@/components/payments/TransactionSkeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/constants';

export default function FarmerOverview() {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);
  useEffect(() => { apiClient.dashboard.farmerSummary().then(setData).catch(() => setData({ summary: {}, recentOrders: [], recentBids: [], months: [] })); }, []);
  if (!data) return <TransactionSkeleton />;
  const stats = data.summary || {};
  return (
    <div className="space-y-6">
      <div><h2 className="font-heading text-xl font-bold">স্বাগতম, {user?.full_name || 'কৃষক'}! 🌾</h2><p className="text-sm text-muted-foreground">আপনার কৃষি কার্যক্রমের দ্রুত সারসংক্ষেপ</p></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Sprout} label="সক্রিয় তালিকা" value={Number(stats.active_listings || 0).toLocaleString('bn-BD')} color="text-green-600" bgColor="bg-green-100" />
        <StatCard icon={Package} label="মোট অর্ডার" value={Number(stats.total_orders || 0).toLocaleString('bn-BD')} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard icon={Clock} label="অপেক্ষমাণ অর্ডার" value={Number(stats.pending_orders || 0).toLocaleString('bn-BD')} color="text-yellow-600" bgColor="bg-yellow-100" />
        <StatCard icon={Banknote} label="যাচাইকৃত আয়" value={formatCurrency(stats.revenue || 0)} color="text-primary" bgColor="bg-primary/10" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/farmer/equipment-booking" className="group rounded-2xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-md">
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="rounded-xl bg-orange-100 p-3 text-orange-700"><Wrench className="h-6 w-6" /></span><div><h3 className="font-heading font-semibold">যন্ত্রপাতি বুকিং</h3><p className="text-xs text-muted-foreground">যন্ত্রপাতি খুঁজুন ও বুকিং পরিচালনা করুন</p></div></div><span className="text-sm font-medium text-primary group-hover:underline">খুলুন</span></div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-muted p-3"><strong className="block text-xl">{Number(stats.equipment_bookings || 0).toLocaleString('bn-BD')}</strong><span className="text-xs text-muted-foreground">মোট বুকিং</span></div><div className="rounded-xl bg-amber-50 p-3 text-amber-800"><Clock className="mx-auto mb-1 h-4 w-4" /><strong>{Number(stats.equipment_pending || 0).toLocaleString('bn-BD')}</strong><span className="block text-xs">অপেক্ষমাণ</span></div><div className="rounded-xl bg-green-50 p-3 text-green-800"><CheckCircle2 className="mx-auto mb-1 h-4 w-4" /><strong>{Number(stats.equipment_approved || 0).toLocaleString('bn-BD')}</strong><span className="block text-xs">অনুমোদিত</span></div></div>
        </Link>
        <Link to="/farmer/transport-request" className="group rounded-2xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-md">
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-100 p-3 text-blue-700"><Truck className="h-6 w-6" /></span><div><h3 className="font-heading font-semibold">পরিবহন অনুরোধ</h3><p className="text-xs text-muted-foreground">যানবাহন খুঁজুন ও অনুরোধ পরিচালনা করুন</p></div></div><span className="text-sm font-medium text-primary group-hover:underline">খুলুন</span></div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-muted p-3"><strong className="block text-xl">{Number(stats.transport_requests || 0).toLocaleString('bn-BD')}</strong><span className="text-xs text-muted-foreground">মোট অনুরোধ</span></div><div className="rounded-xl bg-amber-50 p-3 text-amber-800"><Clock className="mx-auto mb-1 h-4 w-4" /><strong>{Number(stats.transport_pending || 0).toLocaleString('bn-BD')}</strong><span className="block text-xs">অপেক্ষমাণ</span></div><div className="rounded-xl bg-green-50 p-3 text-green-800"><CheckCircle2 className="mx-auto mb-1 h-4 w-4" /><strong>{Number(stats.transport_accepted || 0).toLocaleString('bn-BD')}</strong><span className="block text-xs">গৃহীত</span></div></div>
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5"><h3 className="mb-4 font-semibold">মাসিক বিক্রি</h3><div className="h-64">{data.months.length ? <ResponsiveContainer><BarChart data={data.months}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="sales" fill="#15803d" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">যাচাইকৃত বিক্রির তথ্য এখনো নেই</div>}</div></div>
        <div className="rounded-2xl border bg-card p-5"><div className="mb-4 flex justify-between"><h3 className="font-semibold">সর্বশেষ বিড</h3><Button asChild size="sm" variant="outline"><Link to="/farmer-dashboard/bids">সব দেখুন</Link></Button></div><div className="space-y-2">{data.recentBids.length ? data.recentBids.map((bid) => <div key={bid.id} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span>{bid.crop_name} · {bid.buyer_name}</span><StatusBadge status={bid.status} /></div>) : <p className="py-8 text-center text-sm text-muted-foreground">কোনো বিড নেই</p>}</div></div>
      </div>
      <div className="rounded-2xl border bg-card p-5"><h3 className="mb-4 font-semibold">সাম্প্রতিক অর্ডার</h3><div className="space-y-2">{data.recentOrders.length ? data.recentOrders.map((order) => <div key={order.id} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span>{order.buyer_name || 'ক্রেতা'}</span><span className="font-semibold text-primary">{formatCurrency(order.total_amount)}</span><StatusBadge status={order.status} /></div>) : <p className="py-8 text-center text-sm text-muted-foreground">এখনো কোনো অর্ডার নেই</p>}</div></div>
    </div>
  );
}
