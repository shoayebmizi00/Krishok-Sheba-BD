import React, { useEffect, useMemo, useState } from 'react';
import { Eye, MessageSquare, Search, ShieldCheck, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ROLE_LABELS, formatCurrency, formatDate } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS);

export default function AdminUsers() {
  const { user: currentAdmin } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [activity, setActivity] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setUsers(await apiClient.entities.User.list('-created_date', 500));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => users.filter((user) => {
    const term = search.toLowerCase();
    const matchesSearch = !term || [user.full_name, user.email, user.phone, user.district]
      .some((value) => String(value || '').toLowerCase().includes(term));
    return matchesSearch && (roleFilter === 'all' || user.role === roleFilter);
  }), [users, search, roleFilter]);

  const updateUser = async (user, changes, message) => {
    await apiClient.entities.User.update(user.id, changes);
    toast({ title: message });
    await load();
    setSelected((current) => current?.id === user.id ? { ...current, ...changes } : current);
  };

  const showDetails = async (user) => {
    setSelected(user);
    setActivity(null);
    const [listings, bids, ordersAsBuyer, ordersAsSeller, transactions, equipment, vehicles] = await Promise.all([
      apiClient.entities.CropListing.filter({ farmer_id: user.id }, '-created_date', 100),
      apiClient.entities.Bid.filter(user.role === 'buyer' ? { buyer_id: user.id } : { farmer_id: user.id }, '-created_date', 100),
      apiClient.entities.Order.filter({ buyer_id: user.id }, '-created_date', 100),
      apiClient.entities.Order.filter({ seller_id: user.id }, '-created_date', 100),
      apiClient.entities.Transaction.filter({ user_id: user.id }, '-created_date', 100),
      apiClient.entities.Equipment.filter({ owner_id: user.id }, '-created_date', 100),
      apiClient.entities.Vehicle.filter({ owner_id: user.id }, '-created_date', 100)
    ]);
    setActivity({ listings, bids, orders: [...ordersAsBuyer, ...ordersAsSeller], transactions, equipment, vehicles });
  };

  const remove = async (user) => {
    if (user.id === currentAdmin.id) return;
    await apiClient.entities.User.delete(user.id);
    toast({ title: 'ব্যবহারকারী মুছে ফেলা হয়েছে' });
    setSelected(null);
    load();
  };

  const messageUser = async (user) => {
    try {
      const conversation = await apiClient.messaging.createConversation({
        receiver_id: user.id,
        related_type: 'user',
        related_id: user.id,
        subject: user.full_name
      });
      navigate(`/admin/messages/${conversation.id}`);
    } catch (error) {
      toast({ title: 'কথোপকথন শুরু করা যায়নি', description: error.message, variant: 'destructive', duration: 3000 });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div><h2 className="font-heading text-xl font-bold">ব্যবহারকারী ব্যবস্থাপনা</h2><p className="text-sm text-muted-foreground">অনুমোদন, ভূমিকা, স্থগিতকরণ ও ব্যবহারকারীর কার্যক্রম নিয়ন্ত্রণ করুন</p></div>
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="নাম, ইমেইল, ফোন বা জেলা খুঁজুন" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div>
        <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">সব ভূমিকা</SelectItem>{ROLE_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
      </div>
      {!filtered.length ? <EmptyState icon={Users} title="কোনো ব্যবহারকারী পাওয়া যায়নি" /> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground"><tr><th className="p-3">ব্যবহারকারী</th><th className="p-3">ভূমিকা</th><th className="p-3">জেলা</th><th className="p-3">অবস্থা</th><th className="p-3">যোগদানের তারিখ</th><th className="p-3">পদক্ষেপ</th></tr></thead>
            <tbody>{filtered.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3"><div className="font-medium">{user.full_name || 'নাম দেওয়া হয়নি'}</div><div className="text-xs text-muted-foreground">{user.email}</div></td>
                <td className="p-3"><Select value={user.role} onValueChange={(role) => updateUser(user, { role }, 'ব্যবহারকারীর ভূমিকা পরিবর্তন হয়েছে')} disabled={user.id === currentAdmin.id}><SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger><SelectContent>{ROLE_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></td>
                <td className="p-3">{user.district || '—'}</td>
                <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.is_active ? 'সক্রিয়' : 'স্থগিত'}</span></td>
                <td className="p-3 text-muted-foreground">{formatDate(user.created_date)}</td>
                <td className="p-3"><div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => showDetails(user)} aria-label="বিস্তারিত দেখুন"><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" disabled={user.id === currentAdmin.id} onClick={() => updateUser(user, { is_active: !user.is_active }, user.is_active ? 'অ্যাকাউন্ট স্থগিত করা হয়েছে' : 'অ্যাকাউন্ট সক্রিয় করা হয়েছে')} aria-label={user.is_active ? 'স্থগিত করুন' : 'সক্রিয় করুন'}>{user.is_active ? <UserX className="h-4 w-4 text-orange-600" /> : <UserCheck className="h-4 w-4 text-green-600" />}</Button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> ব্যবহারকারীর বিস্তারিত</DialogTitle></DialogHeader>
          {selected && <div className="space-y-5">
            <div className="grid gap-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-2">
              <div><span className="text-xs text-muted-foreground">নাম</span><p className="font-medium">{selected.full_name}</p></div>
              <div><span className="text-xs text-muted-foreground">ইমেইল</span><p className="font-medium">{selected.email}</p></div>
              <div><span className="text-xs text-muted-foreground">ফোন</span><p>{selected.phone || '—'}</p></div>
              <div><span className="text-xs text-muted-foreground">জেলা</span><p>{selected.district || '—'}</p></div>
              <div><span className="text-xs text-muted-foreground">ভূমিকা</span><p>{ROLE_LABELS[selected.role]}</p></div>
              <div><span className="text-xs text-muted-foreground">খামার</span><p>{selected.farm_name || '—'}</p></div>
            </div>
            {!activity ? <LoadingSpinner /> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[['ফসল তালিকা', activity.listings.length], ['বিড', activity.bids.length], ['অর্ডার', activity.orders.length], ['লেনদেন', activity.transactions.length], ['যন্ত্রপাতি', activity.equipment.length], ['যানবাহন', activity.vehicles.length]].map(([label, value]) => <div key={label} className="rounded-xl border p-3"><div className="text-2xl font-bold text-primary">{value.toLocaleString('bn-BD')}</div><div className="text-xs text-muted-foreground">{label}</div></div>)}
              <div className="col-span-2 rounded-xl border p-3 sm:col-span-3"><div className="text-xs text-muted-foreground">লেনদেনের মোট পরিমাণ</div><div className="text-lg font-bold text-primary">{formatCurrency(activity.transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0))}</div></div>
            </div>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => messageUser(selected)} disabled={selected.id === currentAdmin.id || !selected.is_active}><MessageSquare className="mr-2 h-4 w-4" /> বার্তা দিন</Button>
              <Button variant="outline" onClick={() => updateUser(selected, { is_active: !selected.is_active }, selected.is_active ? 'অ্যাকাউন্ট স্থগিত করা হয়েছে' : 'অ্যাকাউন্ট সক্রিয় করা হয়েছে')} disabled={selected.id === currentAdmin.id}>{selected.is_active ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}{selected.is_active ? 'স্থগিত করুন' : 'সক্রিয় করুন'}</Button>
              <Button variant="destructive" onClick={() => remove(selected)} disabled={selected.id === currentAdmin.id}><Trash2 className="mr-2 h-4 w-4" /> ব্যবহারকারী মুছুন</Button>
            </div>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
