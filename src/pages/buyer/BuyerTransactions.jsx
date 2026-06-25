import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clipboard, CreditCard, ImagePlus, ReceiptText } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import TransactionSkeleton from '@/components/payment/TransactionSkeleton';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';

const initialForm = { order_id: '', payment_method: 'bkash', amount: '', sender_number: '', sender_bank: '', account_number: '', transaction_reference: '', screenshot_url: '', note: '' };

export default function BuyerTransactions() {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [context, setContext] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [sent, orderData] = await Promise.all([
      apiClient.transactions.mySent(1, 20),
      apiClient.entities.Order.list('-created_date', 30)
    ]);
    setTransactions(sent.items);
    setOrders(orderData);
    setLoading(false);
  };
  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const selectOrder = async (orderId) => {
    setForm((current) => ({ ...current, order_id: orderId }));
    try {
      const data = await apiClient.transactions.paymentContext(orderId);
      setContext(data);
      setForm((current) => ({ ...current, order_id: orderId, amount: String(data.total_amount || '') }));
    } catch (error) {
      toast({ title: 'অর্ডারের তথ্য পাওয়া যায়নি', description: error.message, variant: 'destructive' });
    }
  };
  const selectedAccount = useMemo(() => {
    if (!context) return '';
    if (form.payment_method === 'bank_transfer') return context.bank_account_number;
    return context[`${form.payment_method}_number`] || '';
  }, [context, form.payment_method]);
  const copy = async (value) => {
    await navigator.clipboard.writeText(value);
    toast({ title: 'অ্যাকাউন্ট নম্বর কপি করা হয়েছে' });
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await apiClient.upload(file, 'payments');
      setForm((current) => ({ ...current, screenshot_url: result.file_url }));
      toast({ title: 'পেমেন্টের ছবি যোগ করা হয়েছে' });
    } catch (error) {
      toast({ title: 'ছবি আপলোড করা যায়নি', description: error.message, variant: 'destructive' });
    }
  };
  const submit = async () => {
    if (!form.order_id || !form.amount) return toast({ title: 'অর্ডার ও টাকার পরিমাণ দিন', variant: 'destructive' });
    setSubmitting(true);
    try {
      await apiClient.transactions.create(form);
      toast({ title: 'পেমেন্ট তথ্য সফলভাবে পাঠানো হয়েছে' });
      setForm(initialForm); setContext(null);
      await load();
    } catch (error) {
      toast({ title: 'কিছু ভুল হয়েছে, আবার চেষ্টা করুন', description: error.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  if (loading) return <TransactionSkeleton />;
  const mobile = ['bkash', 'nagad', 'rocket', 'upay'].includes(form.payment_method);
  const bank = form.payment_method === 'bank_transfer';
  const noReference = ['cash_on_delivery', 'cash'].includes(form.payment_method);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-medium text-primary">নিরাপদ ম্যানুয়াল লেনদেন</p>
        <h2 className="font-heading text-2xl font-bold">পেমেন্ট সম্পন্ন করুন</h2>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border bg-card p-3 text-center text-xs sm:text-sm">
        {['১. অর্ডার', '২. পেমেন্ট', '৩. নিশ্চিতকরণ'].map((step, index) => (
          <div key={step} className={`rounded-xl px-2 py-3 ${index <= (context ? 1 : 0) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{step}</div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6 rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
          <div>
            <label className="mb-2 block text-sm font-semibold">অর্ডার নির্বাচন করুন</label>
            <Select value={form.order_id} onValueChange={selectOrder}>
              <SelectTrigger><SelectValue placeholder="পেমেন্টের জন্য অর্ডার বাছাই করুন" /></SelectTrigger>
              <SelectContent>{orders.map((order) => <SelectItem key={order.id} value={order.id}>#{order.id.slice(-6)} · {order.items?.[0]?.name || 'ফসল'} · {formatCurrency(order.total_amount)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">পেমেন্ট পদ্ধতি</h3>
            <PaymentMethodSelector value={form.payment_method} onChange={(payment_method) => setForm((current) => ({ ...current, payment_method }))} />
          </div>
          {form.payment_method === 'cash_on_delivery' ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">পণ্য ডেলিভারির সময় পেমেন্ট সংগ্রহ করা হবে। কোনো ট্রানজেকশন আইডি প্রয়োজন নেই।</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {mobile && <label className="text-sm font-medium">প্রেরক মোবাইল নম্বর<Input className="mt-1" value={form.sender_number} onChange={(e) => setForm({ ...form, sender_number: e.target.value })} /></label>}
              {bank && <><label className="text-sm font-medium">প্রেরক ব্যাংকের নাম<Input className="mt-1" value={form.sender_bank} onChange={(e) => setForm({ ...form, sender_bank: e.target.value })} /></label><label className="text-sm font-medium">প্রেরক হিসাব নম্বর<Input className="mt-1" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></label></>}
              {!noReference && <label className="text-sm font-medium">ট্রানজেকশন আইডি / রেফারেন্স<Input className="mt-1" value={form.transaction_reference} onChange={(e) => setForm({ ...form, transaction_reference: e.target.value })} /></label>}
              <label className="text-sm font-medium">টাকার পরিমাণ<Input type="number" className="mt-1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-sm text-primary"><ImagePlus className="h-4 w-4" />{form.screenshot_url ? 'ছবি যোগ হয়েছে' : 'পেমেন্টের ছবি (ঐচ্ছিক)'}<input type="file" accept="image/*" className="hidden" onChange={upload} /></label>
              <label className="text-sm font-medium sm:col-span-2">নোট (ঐচ্ছিক)<Textarea className="mt-1" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            </div>
          )}
          <Button onClick={submit} disabled={submitting || !context} className="h-12 w-full text-base"><CreditCard className="mr-2 h-5 w-5" />{submitting ? 'পাঠানো হচ্ছে...' : 'পেমেন্ট তথ্য পাঠান'}</Button>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border bg-gradient-to-br from-emerald-950 to-emerald-700 p-6 text-white">
            <h3 className="font-semibold">অর্ডার সারাংশ</h3>
            {context ? <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-white/70">অর্ডার আইডি</span><span>#{context.id?.slice(-8)}</span></div>
              <div className="flex justify-between"><span className="text-white/70">বিক্রেতা</span><span>{context.seller_name}</span></div>
              <div className="flex justify-between"><span className="text-white/70">ফসল</span><span>{context.items?.[0]?.name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-white/70">পরিমাণ</span><span>{context.items?.[0]?.quantity || '—'} {context.items?.[0]?.unit || ''}</span></div>
              <div className="flex justify-between border-t border-white/20 pt-3 text-lg font-bold"><span>মোট</span><span>{formatCurrency(context.total_amount)}</span></div>
              <div className="flex gap-2"><StatusBadge status={context.status} /><StatusBadge status={context.payment_status} /></div>
            </div> : <p className="mt-4 text-sm text-white/70">অর্ডার নির্বাচন করলে বিস্তারিত দেখা যাবে।</p>}
          </div>
          <div className="rounded-3xl border bg-card p-6">
            <h3 className="font-semibold">বিক্রেতার পেমেন্ট হিসাব</h3>
            {context ? <div className="mt-4 space-y-3 text-sm">
              {selectedAccount ? <div className="flex items-center justify-between rounded-xl bg-primary/5 p-3"><div><p className="text-xs text-muted-foreground">{bank ? context.bank_name : form.payment_method.toUpperCase()}</p><p className="font-semibold">{selectedAccount}</p></div><Button size="sm" variant="outline" onClick={() => copy(selectedAccount)}><Clipboard className="mr-1 h-3 w-3" />কপি করুন</Button></div> : <p className="rounded-xl bg-amber-50 p-3 text-amber-800">এই পদ্ধতির হিসাব এখনো যোগ করা হয়নি। বিক্রেতার সঙ্গে যোগাযোগ করুন।</p>}
              {bank && <><p>হিসাবধারী: {context.account_holder_name || '—'}</p><p>শাখা: {context.branch_name || '—'}</p></>}
              <p className="flex gap-2 text-xs text-muted-foreground"><Check className="h-4 w-4 text-primary" />টাকা পাঠানোর পর সঠিক রেফারেন্স দিন। বিক্রেতা যাচাই করে গ্রহণ করবেন।</p>
            </div> : <p className="mt-4 text-sm text-muted-foreground">অর্ডার নির্বাচনের অপেক্ষায়।</p>}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-heading text-lg font-bold">আমার পাঠানো পেমেন্ট</h3>
        {!transactions.length ? <EmptyState icon={ReceiptText} title="এখনো কোনো পেমেন্ট পাঠানো হয়নি" /> : (
          <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full text-sm"><thead className="bg-muted/60 text-left"><tr><th className="p-3">কোড</th><th className="p-3">অর্ডার</th><th className="p-3">পদ্ধতি</th><th className="p-3">পরিমাণ</th><th className="p-3">অবস্থা</th><th className="p-3">তারিখ</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.id} className="border-t"><td className="p-3 font-medium">{item.transaction_code || item.id.slice(-8)}</td><td className="p-3">#{item.order_id?.slice(-6)}</td><td className="p-3">{(item.payment_method || '—').replaceAll('_', ' ')}</td><td className="p-3 font-semibold text-primary">{formatCurrency(item.amount)}</td><td className="p-3"><StatusBadge status={item.status} /></td><td className="p-3 text-muted-foreground">{formatDate(item.created_date)}</td></tr>)}</tbody></table></div>
        )}
      </div>
    </div>
  );
}
