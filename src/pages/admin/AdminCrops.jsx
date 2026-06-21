import React, { useEffect, useMemo, useState } from 'react';
import { Check, Search, Sparkles, Sprout, Trash2, X } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/constants';

export default function AdminCrops() {
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const load = async () => {
    setListings(await apiClient.entities.CropListing.list('-created_date', 500));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => listings.filter((listing) => {
    const term = search.toLowerCase();
    const matchesSearch = !term || [listing.crop_name, listing.farmer_name, listing.district]
      .some((value) => String(value || '').toLowerCase().includes(term));
    return matchesSearch && (status === 'all' || listing.status === status);
  }), [listings, search, status]);

  const update = async (listing, changes, title) => {
    await apiClient.entities.CropListing.update(listing.id, changes);
    toast({ title });
    load();
  };
  const remove = async (id) => {
    await apiClient.entities.CropListing.delete(id);
    toast({ title: 'ফসলের তালিকা মুছে ফেলা হয়েছে' });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div><h2 className="font-heading text-xl font-bold">ফসলের তালিকা ব্যবস্থাপনা</h2><p className="text-sm text-muted-foreground">তালিকা অনুমোদন, প্রত্যাখ্যান, ফিচার ও মজুত পর্যবেক্ষণ করুন</p></div>
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ফসল, কৃষক বা জেলা খুঁজুন" className="pl-9" /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">সব অবস্থা</SelectItem><SelectItem value="pending">অপেক্ষমাণ</SelectItem><SelectItem value="active">সক্রিয়</SelectItem><SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem><SelectItem value="sold_out">বিক্রি শেষ</SelectItem><SelectItem value="inactive">নিষ্ক্রিয়</SelectItem></SelectContent></Select>
      </div>
      {!filtered.length ? <EmptyState icon={Sprout} title="কোনো তালিকা পাওয়া যায়নি" /> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground"><tr><th className="p-3">ফসল</th><th className="p-3">কৃষক</th><th className="p-3">জেলা</th><th className="p-3">মূল্য</th><th className="p-3">মজুত</th><th className="p-3">অবস্থা</th><th className="p-3">পদক্ষেপ</th></tr></thead>
            <tbody>{filtered.map((listing) => (
              <tr key={listing.id} className="border-t">
                <td className="p-3"><div className="font-medium">{listing.crop_name}</div>{listing.is_featured && <span className="text-xs text-amber-600">ফিচার্ড</span>}</td>
                <td className="p-3">{listing.farmer_name || 'কৃষক'}</td>
                <td className="p-3">{listing.district}</td>
                <td className="p-3 font-medium text-primary">{formatCurrency(listing.expected_price)}/{listing.unit}</td>
                <td className="p-3"><div>{Number(listing.remaining_quantity || 0).toLocaleString('bn-BD')} {listing.unit}</div><div className="text-xs text-muted-foreground">বিক্রি: {Number(listing.sold_quantity || 0).toLocaleString('bn-BD')}</div></td>
                <td className="p-3"><StatusBadge status={listing.status} /></td>
                <td className="p-3"><div className="flex flex-wrap gap-1">
                  {['pending', 'rejected'].includes(listing.status) && <Button size="icon" variant="ghost" onClick={() => update(listing, { status: 'active' }, 'তালিকাটি অনুমোদন করা হয়েছে')} aria-label="অনুমোদন"><Check className="h-4 w-4 text-green-600" /></Button>}
                  {listing.status === 'pending' && <Button size="icon" variant="ghost" onClick={() => update(listing, { status: 'rejected' }, 'তালিকাটি প্রত্যাখ্যান করা হয়েছে')} aria-label="প্রত্যাখ্যান"><X className="h-4 w-4 text-red-600" /></Button>}
                  <Button size="icon" variant="ghost" onClick={() => update(listing, { is_featured: !listing.is_featured }, listing.is_featured ? 'ফিচার থেকে সরানো হয়েছে' : 'ফিচার্ড তালিকা করা হয়েছে')} aria-label="ফিচার করুন"><Sparkles className={`h-4 w-4 ${listing.is_featured ? 'fill-amber-400 text-amber-500' : ''}`} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => update(listing, { status: listing.status === 'inactive' ? 'active' : 'inactive' }, listing.status === 'inactive' ? 'তালিকা সক্রিয় করা হয়েছে' : 'তালিকা নিষ্ক্রিয় করা হয়েছে')} aria-label="সক্রিয়তা পরিবর্তন"><Sprout className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(listing.id)} aria-label="মুছুন"><Trash2 className="h-4 w-4" /></Button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
