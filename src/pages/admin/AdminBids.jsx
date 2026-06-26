import React, { useEffect, useMemo, useState } from 'react';
import { Gavel, Search, Trash2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/constants';
import { useToast } from '@/components/ui/use-toast';

export default function AdminBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { toast } = useToast();

  const load = async () => {
    setBids(await apiClient.entities.Bid.list('-created_date', 300));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => bids.filter((bid) => {
    const term = search.toLowerCase();
    const matchesSearch = !term || [bid.crop_name, bid.buyer_name, bid.farmer_name]
      .some((value) => String(value || '').toLowerCase().includes(term));
    return matchesSearch && (status === 'all' || bid.status === status);
  }), [bids, search, status]);

  const remove = async (id) => {
    await apiClient.entities.Bid.delete(id);
    toast({ title: 'বিডটি মুছে ফেলা হয়েছে' });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold">বিড ব্যবস্থাপনা</h2>
        <p className="text-sm text-muted-foreground">সব ক্রেতার প্রস্তাব পর্যবেক্ষণ ও স্প্যাম বিড অপসারণ করুন</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ফসল, ক্রেতা বা কৃষক খুঁজুন" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব অবস্থা</SelectItem>
            <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
            <SelectItem value="accepted">গৃহীত</SelectItem>
            <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
            <SelectItem value="cancelled">বাতিল</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {!filtered.length ? <EmptyState icon={Gavel} title="কোনো বিড পাওয়া যায়নি" /> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr><th className="p-3">ফসল</th><th className="p-3">ক্রেতা</th><th className="p-3">কৃষক</th><th className="p-3">পরিমাণ</th><th className="p-3">দর</th><th className="p-3">অবস্থা</th><th className="p-3">তারিখ</th><th className="p-3">পদক্ষেপ</th></tr>
            </thead>
            <tbody>
              {filtered.map((bid) => (
                <tr key={bid.id} className="border-t">
                  <td className="p-3 font-medium">{bid.crop_name || 'ফসল'}</td>
                  <td className="p-3">{bid.buyer_name || 'ক্রেতা'}</td>
                  <td className="p-3">{bid.farmer_name || bid.farmer_id?.slice(-6)}</td>
                  <td className="p-3">{Number(bid.quantity_requested || 0).toLocaleString('bn-BD')}</td>
                  <td className="p-3 font-medium text-primary">{formatCurrency(bid.bid_amount)}</td>
                  <td className="p-3"><StatusBadge status={bid.status} /></td>
                  <td className="p-3 text-muted-foreground">{formatDate(bid.created_date)}</td>
                  <td className="p-3"><Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(bid.id)} aria-label="বিড মুছুন"><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
