import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency } from '@/lib/constants';

export default function AdminReports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      apiClient.entities.User.list('-created_date', 500),
      apiClient.entities.Order.list('-created_date', 500),
      apiClient.entities.Transaction.list('-created_date', 500),
      apiClient.entities.CropListing.list('-created_date', 500),
      apiClient.entities.EquipmentBooking.list('-created_date', 500),
      apiClient.entities.TransportBooking.list('-created_date', 500)
    ]).then(([users, orders, transactions, listings, equipmentBookings, transportBookings]) => {
      setData({ users, orders, transactions, listings, equipmentBookings, transportBookings });
    });
  }, []);

  const report = useMemo(() => {
    if (!data) return null;
    const verified = data.transactions.filter((item) => ['received', 'verified', 'completed'].includes(item.status));
    const revenue = verified.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const districts = Object.entries(data.orders.reduce((map, order) => {
      const district = order.delivery_district || 'অনির্ধারিত';
      map[district] = (map[district] || 0) + 1;
      return map;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const methods = Object.entries(data.transactions.reduce((map, item) => {
      const method = item.payment_method || 'অনির্ধারিত';
      map[method] = (map[method] || 0) + Number(item.amount || 0);
      return map;
    }, {})).sort((a, b) => b[1] - a[1]);
    return { revenue, districts, methods, bookings: data.equipmentBookings.length + data.transportBookings.length };
  }, [data]);

  if (!data || !report) return <LoadingSpinner />;

  const download = () => {
    const rows = [
      ['প্রতিবেদন', 'মান'],
      ['মোট ব্যবহারকারী', data.users.length],
      ['মোট ফসল তালিকা', data.listings.length],
      ['মোট অর্ডার', data.orders.length],
      ['মোট বুকিং', report.bookings],
      ['যাচাইকৃত আয়', report.revenue]
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'krishok-sheba-report.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><h2 className="font-heading text-xl font-bold">সিস্টেম প্রতিবেদন</h2><p className="text-sm text-muted-foreground">বিক্রয়, লেনদেন, বুকিং ও জেলা-ভিত্তিক কার্যক্রম</p></div>
        <Button variant="outline" onClick={download}><Download className="mr-2 h-4 w-4" /> প্রতিবেদন ডাউনলোড</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BarChart3} label="মোট অর্ডার" value={data.orders.length} />
        <StatCard icon={BarChart3} label="মোট বুকিং" value={report.bookings} />
        <StatCard icon={BarChart3} label="মোট লেনদেন" value={data.transactions.length} />
        <StatCard icon={BarChart3} label="যাচাইকৃত আয়" value={formatCurrency(report.revenue)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">জেলা-ভিত্তিক অর্ডার</h3>
          <div className="space-y-3">{report.districts.map(([district, count]) => <div key={district} className="flex justify-between border-b pb-2 text-sm"><span>{district}</span><strong>{count.toLocaleString('bn-BD')}</strong></div>)}</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">পেমেন্ট পদ্ধতি অনুযায়ী লেনদেন</h3>
          <div className="space-y-3">{report.methods.map(([method, amount]) => <div key={method} className="flex justify-between border-b pb-2 text-sm"><span>{method.replaceAll('_', ' ')}</span><strong className="text-primary">{formatCurrency(amount)}</strong></div>)}</div>
        </div>
      </div>
    </div>
  );
}
