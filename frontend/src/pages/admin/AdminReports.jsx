import React, { useEffect, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency } from '@/utils/constants';

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient.dashboard.adminReport().then(setData).catch(() => setError(true));
  }, []);

  if (error) return <p className="rounded-xl border border-destructive/30 p-6 text-center text-destructive">প্রতিবেদনের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।</p>;
  if (!data) return <LoadingSpinner />;
  const report = data.summary;

  const download = () => {
    const rows = [
      ['প্রতিবেদন', 'মান'],
      ['মোট ব্যবহারকারী', report.users],
      ['মোট ফসল তালিকা', report.listings],
      ['মোট অর্ডার', report.orders],
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
        <StatCard icon={BarChart3} label="মোট অর্ডার" value={report.orders} />
        <StatCard icon={BarChart3} label="মোট বুকিং" value={report.bookings} />
        <StatCard icon={BarChart3} label="মোট লেনদেন" value={report.transactions} />
        <StatCard icon={BarChart3} label="যাচাইকৃত আয়" value={formatCurrency(report.revenue)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">জেলা-ভিত্তিক অর্ডার</h3>
          <div className="space-y-3">{data.districts.map(({ district, count }) => <div key={district} className="flex justify-between border-b pb-2 text-sm"><span>{district}</span><strong>{Number(count).toLocaleString('bn-BD')}</strong></div>)}</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-semibold">পেমেন্ট পদ্ধতি অনুযায়ী লেনদেন</h3>
          <div className="space-y-3">{data.methods.map(({ method, amount }) => <div key={method} className="flex justify-between border-b pb-2 text-sm"><span>{method.replaceAll('_', ' ')}</span><strong className="text-primary">{formatCurrency(amount)}</strong></div>)}</div>
        </div>
      </div>
    </div>
  );
}
