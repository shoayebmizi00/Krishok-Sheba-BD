import React, { useEffect, useState } from 'react';
import { Banknote, CircleDollarSign, Clock3, PackageCheck, ReceiptText, ShieldCheck, XCircle } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import StatCard from '@/components/dashboard/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import TransactionSkeleton from '@/components/payments/TransactionSkeleton';
import { formatCurrency, formatDate } from '@/utils/constants';

export default function FarmerTransactions() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = async () => {
    const [result, totals] = await Promise.all([
      apiClient.transactions.myReceived(1, 30),
      apiClient.dashboard.farmerTransactionsSummary()
    ]);
    setTransactions(result.items);
    setSummary(totals);
    setLoading(false);
  };
  useEffect(() => { load().catch(() => { setError(true); setLoading(false); }); }, []);
  const update = async (id, status) => {
    try {
      const updated = await apiClient.transactions.updateStatus(id, status);
      setTransactions((items) => items.map((item) => item.id === id ? updated : item));
      setSummary(await apiClient.dashboard.farmerTransactionsSummary());
      toast({ title: status === 'received' ? 'পেমেন্ট গ্রহণ করা হয়েছে' : 'লেনদেন বাতিল করা হয়েছে' });
    } catch (error) {
      toast({ title: 'কিছু ভুল হয়েছে, আবার চেষ্টা করুন', description: error.message, variant: 'destructive' });
    }
  };
  if (loading) return <TransactionSkeleton />;
  if (error || !summary) return <p className="rounded-xl border border-destructive/30 p-6 text-center text-destructive">লেনদেনের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।</p>;

  const cards = [
    [Banknote, 'মোট প্রাপ্ত পেমেন্ট', formatCurrency(summary.total), 'text-emerald-700', 'bg-emerald-100'],
    [Clock3, 'অপেক্ষমাণ পেমেন্ট', formatCurrency(summary.pending), 'text-amber-700', 'bg-amber-100'],
    [ShieldCheck, 'যাচাই করা পেমেন্ট', formatCurrency(summary.verified), 'text-blue-700', 'bg-blue-100'],
    [PackageCheck, 'COD পেমেন্ট', summary.cod.toLocaleString('bn-BD'), 'text-violet-700', 'bg-violet-100'],
    [CircleDollarSign, 'মোট আয়', formatCurrency(summary.verified), 'text-primary', 'bg-primary/10']
  ];
  return (
    <div className="space-y-6">
      <div><p className="text-sm font-medium text-primary">আয়ের স্বচ্ছ হিসাব</p><h2 className="font-heading text-2xl font-bold">পেমেন্ট / লেনদেন</h2></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{cards.map(([icon, label, value, color, bg]) => <StatCard key={label} icon={icon} label={label} value={value} color={color} bgColor={bg} />)}</div>
      {!transactions.length ? <EmptyState icon={ReceiptText} title="কোনো পেমেন্ট পাওয়া যায়নি" description="ক্রেতার পাঠানো পেমেন্ট তথ্য এখানে দেখা যাবে।" /> : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm"><thead className="bg-muted/60 text-left"><tr><th className="p-3">ট্রানজেকশন</th><th className="p-3">ক্রেতা / অর্ডার</th><th className="p-3">ফসল</th><th className="p-3">পরিমাণ</th><th className="p-3">পদ্ধতি / প্রেরক</th><th className="p-3">অবস্থা</th><th className="p-3">তারিখ</th><th className="p-3">পদক্ষেপ</th></tr></thead>
          <tbody>{transactions.map((item) => <tr key={item.id} className="border-t align-top"><td className="p-3 font-medium">{item.transaction_code || item.id.slice(-8)}<div className="text-xs text-muted-foreground">{item.transaction_reference || 'রেফারেন্স নেই'}</div></td><td className="p-3">{item.buyer_name || item.buyer_full_name || 'ক্রেতা'}<div className="text-xs text-muted-foreground">#{item.order_id?.slice(-6)}</div></td><td className="p-3">{item.items?.[0]?.name || item.description || '—'}</td><td className="p-3 font-bold text-primary">{formatCurrency(item.amount)}</td><td className="p-3">{(item.payment_method || '—').replaceAll('_', ' ')}<div className="text-xs text-muted-foreground">{item.sender_number || item.sender_account || item.sender_bank || '—'}</div></td><td className="p-3"><StatusBadge status={item.status} /></td><td className="p-3 text-muted-foreground">{formatDate(item.created_date)}</td><td className="p-3"><div className="flex min-w-36 flex-col gap-1">{['pending', 'sent', 'cod_pending'].includes(item.status) && <Button size="sm" onClick={() => update(item.id, 'received')}><PackageCheck className="mr-1 h-4 w-4" />গ্রহণ করেছি</Button>}<Button size="sm" variant="ghost" className="text-destructive" onClick={() => update(item.id, 'failed')}><XCircle className="mr-1 h-4 w-4" />সমস্যা জানান</Button>{item.screenshot_url && <Button asChild size="sm" variant="outline"><a href={item.screenshot_url} target="_blank" rel="noreferrer">ছবি দেখুন</a></Button>}</div></td></tr>)}</tbody></table>
        </div>
      )}
    </div>
  );
}
