import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, CheckCircle2, Search, XCircle } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const { toast } = useToast();

  const load = async () => {
    setTransactions(await apiClient.entities.Transaction.list('-created_date', 500));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => transactions.filter((item) => {
    const term = search.toLowerCase();
    const matchesSearch = !term || [item.counterparty_name, item.reference, item.order_id]
      .some((value) => String(value || '').toLowerCase().includes(term));
    return matchesSearch && (status === 'all' || item.status === status) && (method === 'all' || item.payment_method === method);
  }), [transactions, search, status, method]);
  const revenue = transactions.filter((item) => ['received', 'verified', 'completed'].includes(item.status)).reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const update = async (item, nextStatus) => {
    await apiClient.entities.Transaction.update(item.id, { status: nextStatus });
    toast({ title: nextStatus === 'verified' ? 'পেমেন্ট যাচাই করা হয়েছে' : 'লেনদেন প্রত্যাখ্যান করা হয়েছে' });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="font-heading text-xl font-bold">লেনদেন ব্যবস্থাপনা</h2><p className="text-sm text-muted-foreground">ম্যানুয়াল পেমেন্ট যাচাই ও জাল রেকর্ড প্রত্যাখ্যান করুন</p></div><div className="rounded-xl bg-primary/10 px-4 py-2"><div className="text-xs text-muted-foreground">যাচাইকৃত মোট আয়</div><div className="font-bold text-primary">{formatCurrency(revenue)}</div></div></div>
      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="অর্ডার, রেফারেন্স বা ব্যবহারকারী খুঁজুন" className="pl-9" /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">সব অবস্থা</SelectItem><SelectItem value="sent">পাঠানো</SelectItem><SelectItem value="received">প্রাপ্ত</SelectItem><SelectItem value="verified">যাচাইকৃত</SelectItem><SelectItem value="failed">ব্যর্থ</SelectItem></SelectContent></Select>
        <Select value={method} onValueChange={setMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">সব পদ্ধতি</SelectItem>{['cash_on_delivery','bkash','nagad','rocket','upay','bank_transfer','cash'].map((value) => <SelectItem key={value} value={value}>{value.replaceAll('_', ' ')}</SelectItem>)}</SelectContent></Select>
      </div>
      {!filtered.length ? <EmptyState icon={Banknote} title="কোনো লেনদেন পাওয়া যায়নি" /> : (
        <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-muted-foreground"><tr><th className="p-3">তারিখ</th><th className="p-3">অর্ডার/রেফারেন্স</th><th className="p-3">পদ্ধতি</th><th className="p-3">পরিমাণ</th><th className="p-3">অবস্থা</th><th className="p-3">পদক্ষেপ</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-t"><td className="p-3">{formatDate(item.created_date)}</td><td className="p-3"><div>#{item.order_id?.slice(-6) || '—'}</div><div className="text-xs text-muted-foreground">{item.reference || item.counterparty_name || '—'}</div></td><td className="p-3">{(item.payment_method || '—').replaceAll('_', ' ')}</td><td className="p-3 font-medium text-primary">{formatCurrency(item.amount)}</td><td className="p-3"><StatusBadge status={item.status} /></td><td className="p-3"><Button size="icon" variant="ghost" onClick={() => update(item, 'verified')} disabled={item.status === 'verified'} aria-label="যাচাই করুন"><CheckCircle2 className="h-4 w-4 text-green-600" /></Button><Button size="icon" variant="ghost" onClick={() => update(item, 'failed')} aria-label="প্রত্যাখ্যান করুন"><XCircle className="h-4 w-4 text-red-600" /></Button></td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
