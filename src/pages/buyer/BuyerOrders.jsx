import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Package } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

export default function BuyerOrders() {
  const { user } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptedBids, setAcceptedBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  const [form, setForm] = useState({ quantity: '', delivery_address: '', delivery_district: '', payment_method: 'cash_on_delivery' });
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [data, bids] = await Promise.all([
        apiClient.entities.Order.filter({ buyer_id: user.id }, '-created_date'),
        apiClient.entities.Bid.filter({ buyer_id: user.id, status: 'accepted' }, '-created_date')
      ]);
      setOrders(data);
      setAcceptedBids(bids.filter((bid) => !data.some((order) => order.bid_id === bid.id)));
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  const createOrder = async () => {
    if (!selectedBid || !form.quantity || !form.delivery_address || !form.delivery_district) return;
    try {
      await apiClient.entities.Order.create({
        bid_id: selectedBid.id,
        buyer_name: user.full_name,
        items: [{ name: selectedBid.crop_name, quantity: Number(form.quantity) }],
        delivery_address: form.delivery_address,
        delivery_district: form.delivery_district,
        payment_method: form.payment_method
      });
      toast({ title: 'সফলভাবে অর্ডার নিশ্চিত হয়েছে' });
      setSelectedBid(null);
      window.setTimeout(() => window.location.reload(), 300);
    } catch (error) {
      toast({ title: 'অর্ডার তৈরি হয়নি', description: error.message || 'কিছু ভুল হয়েছে, আবার চেষ্টা করুন', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">আমার অর্ডার</h2>

      {acceptedBids.length > 0 && <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><h3 className="font-semibold">গৃহীত বিড থেকে অর্ডার তৈরি করুন</h3><div className="mt-3 space-y-2">{acceptedBids.map((bid) => <div key={bid.id} className="flex items-center justify-between rounded-lg bg-card p-3"><span>{bid.crop_name} · {formatCurrency(bid.bid_amount)}</span><Button size="sm" onClick={() => { setSelectedBid(bid); setForm((current) => ({ ...current, quantity: bid.quantity_requested || '' })); }}>অর্ডার তৈরি করুন</Button></div>)}</div></div>}

      {orders.length === 0 ? (
        <EmptyState icon={Package} title="এখনো কোনো অর্ডার নেই" description="আপনার নিশ্চিত করা অর্ডার এখানে দেখা যাবে" />
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-foreground">অর্ডার #{order.id?.slice(-6)}</h3>
                <p className="text-sm text-muted-foreground">বিক্রেতা: {order.seller_name || 'কৃষক'}</p>
                <p className="text-xs text-muted-foreground">{formatDate(order.created_date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary">{formatCurrency(order.total_amount)}</span>
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={Boolean(selectedBid)} onOpenChange={(open) => !open && setSelectedBid(null)}>
        <DialogContent><DialogHeader><DialogTitle>অর্ডার নিশ্চিত করুন</DialogTitle></DialogHeader><div className="space-y-4"><Input type="number" placeholder="পরিমাণ" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /><Input placeholder="ডেলিভারি ঠিকানা" value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} /><Input placeholder="ডেলিভারি জেলা" value={form.delivery_district} onChange={(e) => setForm({ ...form, delivery_district: e.target.value })} /><Select value={form.payment_method} onValueChange={(value) => setForm({ ...form, payment_method: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash_on_delivery">ক্যাশ অন ডেলিভারি</SelectItem><SelectItem value="bkash">বিকাশ</SelectItem><SelectItem value="nagad">নগদ</SelectItem><SelectItem value="rocket">রকেট</SelectItem><SelectItem value="upay">উপায়</SelectItem><SelectItem value="bank_transfer">ব্যাংক ট্রান্সফার</SelectItem><SelectItem value="cash">নগদ টাকা</SelectItem></SelectContent></Select><Button onClick={createOrder} className="w-full">অর্ডার নিশ্চিত করুন</Button></div></DialogContent>
      </Dialog>
    </div>
  );
}
