import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Package } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAppSettings } from '@/hooks/useAppSettings';

const emptyForm = { quantity: '', delivery_location: '', district: '', payment_method: 'cash_on_delivery' };

export default function BuyerOrders() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [acceptedBids, setAcceptedBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { options: paymentMethods } = useAppSettings('payment_method');
  const { options: districts } = useAppSettings('district');

  const load = async () => {
    const [orderData, bids] = await Promise.all([
      apiClient.entities.Order.filter({ buyer_id: user.id }, '-created_date', 50),
      apiClient.entities.Bid.filter({ buyer_id: user.id, status: 'accepted' }, '-created_date', 50)
    ]);
    setOrders(orderData);
    setAcceptedBids(bids.filter((bid) => !orderData.some((order) => order.bid_id === bid.id)));
    setLoading(false);
  };
  useEffect(() => { if (user) load().catch(() => setLoading(false)); }, [user?.id]);

  const openOrder = async (bid) => {
    try {
      const listing = await apiClient.entities.CropListing.get(bid.listing_id);
      setSelectedBid(bid);
      setSelectedListing(listing);
      setForm({ ...emptyForm, quantity: String(bid.quantity_requested || '') });
    } catch (error) {
      toast({ title: 'ফসলের তথ্য পাওয়া যায়নি', description: error.message, variant: 'destructive' });
    }
  };
  const createOrder = async () => {
    const quantity = Number(form.quantity);
    if (!selectedBid || !selectedListing || !quantity || !form.delivery_location || !form.district) {
      return toast({ title: 'অর্ডারের প্রয়োজনীয় তথ্য পূরণ করুন', variant: 'destructive' });
    }
    const remaining = Number(selectedListing.remaining_quantity ?? selectedListing.quantity ?? 0);
    if (quantity > remaining) return toast({ title: 'পর্যাপ্ত পরিমাণ ফসল নেই', variant: 'destructive' });
    if (Number(selectedBid.quantity_requested) > 0 && quantity > Number(selectedBid.quantity_requested)) {
      return toast({ title: 'গৃহীত বিডের পরিমাণের বেশি অর্ডার করা যাবে না', variant: 'destructive' });
    }
    setSubmitting(true);
    try {
      const order = await apiClient.entities.Order.create({
        bid_id: selectedBid.id,
        crop_listing_id: selectedBid.listing_id,
        quantity,
        delivery_location: form.delivery_location,
        district: form.district,
        payment_method: form.payment_method
      });
      setOrders((items) => [order, ...items]);
      setAcceptedBids((items) => items.filter((bid) => bid.id !== selectedBid.id));
      setSelectedBid(null); setSelectedListing(null); setForm(emptyForm);
      toast({ title: 'অর্ডার সফলভাবে তৈরি হয়েছে' });
    } catch (error) {
      const message = error.status === 403 ? 'আপনার এই অর্ডার তৈরি করার অনুমতি নেই' : error.message;
      toast({ title: 'অর্ডার তৈরি হয়নি', description: message || 'কিছু ভুল হয়েছে, আবার চেষ্টা করুন', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold">আমার অর্ডার</h2>
      {acceptedBids.length > 0 && <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><h3 className="font-semibold">গৃহীত বিড থেকে অর্ডার তৈরি করুন</h3><div className="mt-3 space-y-2">{acceptedBids.map((bid) => <div key={bid.id} className="flex flex-col justify-between gap-3 rounded-xl bg-card p-3 sm:flex-row sm:items-center"><div><strong>{bid.crop_name}</strong><p className="text-xs text-muted-foreground">গৃহীত পরিমাণ: {Number(bid.quantity_requested || 0).toLocaleString('bn-BD')} · দর: {formatCurrency(bid.bid_amount)}</p></div><Button size="sm" onClick={() => openOrder(bid)}>অর্ডার তৈরি করুন</Button></div>)}</div></section>}
      {!orders.length ? <EmptyState icon={Package} title="এখনো কোনো অর্ডার নেই" description="আপনার তৈরি করা অর্ডার এখানে দেখা যাবে" /> : <div className="space-y-3">{orders.map((order) => <article key={order.id} className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"><div><h3 className="font-medium">অর্ডার #{order.id?.slice(-6)}</h3><p className="text-sm text-muted-foreground">বিক্রেতা: {order.seller_name || 'কৃষক'}</p><p className="text-xs text-muted-foreground">{formatDate(order.created_date || order.created_at)}</p></div><div className="flex items-center gap-3"><span className="font-bold text-primary">{formatCurrency(order.total_amount)}</span><StatusBadge status={order.status} /></div></article>)}</div>}

      <Dialog open={Boolean(selectedBid)} onOpenChange={(open) => { if (!open) { setSelectedBid(null); setSelectedListing(null); } }}>
        <DialogContent><DialogHeader><DialogTitle>অর্ডার নিশ্চিত করুন</DialogTitle></DialogHeader>
          <div className="rounded-xl bg-muted/50 p-3 text-sm"><strong>{selectedBid?.crop_name}</strong><p>উপলব্ধ: {Number(selectedListing?.remaining_quantity ?? selectedListing?.quantity ?? 0).toLocaleString('bn-BD')} {selectedListing?.unit || ''}</p><p>গৃহীত বিড: {Number(selectedBid?.quantity_requested || 0).toLocaleString('bn-BD')} {selectedListing?.unit || ''}</p></div>
          <div className="space-y-4">
            <label className="text-sm font-medium">পরিমাণ<Input type="number" min="1" max={Math.min(Number(selectedListing?.remaining_quantity || Infinity), Number(selectedBid?.quantity_requested || Infinity))} className="mt-1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
            <label className="text-sm font-medium">পিকআপ/ডেলিভারি স্থান<Input className="mt-1" value={form.delivery_location} onChange={(e) => setForm({ ...form, delivery_location: e.target.value })} /></label>
            <label className="text-sm font-medium">গন্তব্য জেলা<Select value={form.district} onValueChange={(district) => setForm({ ...form, district })}><SelectTrigger className="mt-1"><SelectValue placeholder="জেলা নির্বাচন করুন" /></SelectTrigger><SelectContent>{districts.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></label>
            <label className="text-sm font-medium">পেমেন্ট পদ্ধতি<Select value={form.payment_method} onValueChange={(payment_method) => setForm({ ...form, payment_method })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{paymentMethods.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></label>
            <Button onClick={createOrder} disabled={submitting} className="w-full">{submitting ? 'অর্ডার তৈরি হচ্ছে...' : 'অর্ডার নিশ্চিত করুন'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
