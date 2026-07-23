import React, { useEffect, useState } from 'react';
import { Banknote, CheckCircle2, Clock3, PackageCheck, Search, XCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import StatCard from '@/components/dashboard/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import TransactionSkeleton from '@/components/payments/TransactionSkeleton';
import { formatCurrency, formatDate } from '@/utils/constants';
import { useAppSettings } from '@/hooks/useAppSettings';

const COLORS = ['#15803d', '#f59e0b', '#2563eb', '#7c3aed', '#e11d48', '#64748b'];
export default function AdminTransactions() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', payment_method: '', date_from: '', date_to: '', page: 1, limit: 30 });
  const [loading, setLoading] = useState(true);
  const { options: paymentMethods } = useAppSettings('payment_method');
  const load = async (next = filters) => {
    const [list, totals] = await Promise.all([apiClient.transactions.adminList(next), apiClient.transactions.adminSummary()]);
    setItems(list.items); setSummary(totals); setLoading(false);
  };
  useEffect(() => { load().catch(() => setLoading(false)); }, []);
  const apply = () => { setLoading(true); load(filters).catch(() => setLoading(false)); };
  const update = async (id, status) => {
    try {
      const updated = await apiClient.transactions.updateStatus(id, status);
      setItems((rows) => rows.map((row) => row.id === id ? updated : row));
      toast({ title: status === 'verified' ? 'পেমেন্ট যাচাই করা হয়েছে' : status === 'received' ? 'পেমেন্ট গ্রহণ করা হয়েছে' : 'জাল লেনদেন প্রত্যাখ্যান করা হয়েছে' });
      const totals = await apiClient.transactions.adminSummary(); setSummary(totals);
    } catch (error) { toast({ title: 'কিছু ভুল হয়েছে, আবার চেষ্টা করুন', description: error.message, variant: 'destructive' }); }
  };
  if (loading || !summary) return <TransactionSkeleton />;
  return (
    <div className="space-y-6">
      <div><p className="text-sm font-medium text-primary">কেন্দ্রীয় পর্যবেক্ষণ</p><h2 className="font-heading text-2xl font-bold">লেনদেন ব্যবস্থাপনা</h2></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Banknote} label="মোট লেনদেন" value={Number(summary.total_transactions).toLocaleString('bn-BD')} color="text-emerald-700" bgColor="bg-emerald-100" />
        <StatCard icon={CheckCircle2} label="মোট পরিশোধিত" value={formatCurrency(summary.total_paid)} color="text-blue-700" bgColor="bg-blue-100" />
        <StatCard icon={Clock3} label="অপেক্ষমাণ পরিমাণ" value={formatCurrency(summary.pending_amount)} color="text-amber-700" bgColor="bg-amber-100" />
        <StatCard icon={PackageCheck} label="COD লেনদেন" value={Number(summary.cod_transactions).toLocaleString('bn-BD')} color="text-violet-700" bgColor="bg-violet-100" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4"><h3 className="mb-3 font-semibold">পেমেন্ট পদ্ধতির বণ্টন</h3><div className="h-56"><ResponsiveContainer><PieChart><Pie data={summary.methods} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78} label>{summary.methods.map((item, i) => <Cell key={item.name} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
        <div className="rounded-2xl border bg-card p-4"><h3 className="mb-3 font-semibold">মাসিক লেনদেন</h3><div className="h-56"><ResponsiveContainer><BarChart data={summary.months}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="amount" fill="#15803d" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
      </div>
      <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="relative md:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="কোড, ক্রেতা বা বিক্রেতা" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
        <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">সব অবস্থা</SelectItem>{['sent','received','verified','failed','cancelled','cod_pending'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.payment_method || 'all'} onValueChange={(value) => setFilters({ ...filters, payment_method: value === 'all' ? '' : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">সব পদ্ধতি</SelectItem>{paymentMethods.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
        <Input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
        <Button onClick={apply}>ফিল্টার করুন</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full text-sm"><thead className="bg-muted/60 text-left"><tr><th className="p-3">লেনদেন</th><th className="p-3">ক্রেতা → বিক্রেতা</th><th className="p-3">পদ্ধতি</th><th className="p-3">পরিমাণ</th><th className="p-3">অবস্থা</th><th className="p-3">তারিখ</th><th className="p-3">পদক্ষেপ</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t"><td className="p-3 font-medium">{item.transaction_code || item.id.slice(-8)}<div className="text-xs text-muted-foreground">#{item.order_id?.slice(-6)}</div></td><td className="p-3">{item.buyer_name || item.buyer_full_name || '—'}<div className="text-xs text-muted-foreground">→ {item.seller_name || item.seller_full_name || '—'}</div></td><td className="p-3">{(item.payment_method || '—').replaceAll('_', ' ')}</td><td className="p-3 font-bold text-primary">{formatCurrency(item.amount)}</td><td className="p-3"><StatusBadge status={item.status} /></td><td className="p-3">{formatDate(item.created_date)}</td><td className="p-3"><Button size="icon" variant="ghost" onClick={() => update(item.id, 'verified')} aria-label="যাচাই"><CheckCircle2 className="h-4 w-4 text-green-600" /></Button><Button size="icon" variant="ghost" onClick={() => update(item.id, 'received')} aria-label="গ্রহণ"><PackageCheck className="h-4 w-4 text-blue-600" /></Button><Button size="icon" variant="ghost" onClick={() => update(item.id, 'failed')} aria-label="প্রত্যাখ্যান"><XCircle className="h-4 w-4 text-red-600" /></Button></td></tr>)}</tbody></table></div>
    </div>
  );
}
