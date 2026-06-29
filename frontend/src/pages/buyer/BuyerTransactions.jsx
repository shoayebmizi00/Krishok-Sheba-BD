import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, ImagePlus, Loader2, ReceiptText } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import PaymentMethodSelector from '@/components/payments/PaymentMethodSelector';
import TransactionSkeleton from '@/components/payments/TransactionSkeleton';
import OrderSummaryCard from '@/components/payments/OrderSummaryCard';
import SellerPaymentInfo from '@/components/payments/SellerPaymentInfo';
import PaymentSuccess from '@/components/payments/PaymentSuccess';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { PAYMENT_METHOD_BY_ID, paymentMethodLabel } from '@/components/payments/paymentMethods';
import { formatCurrency, formatDate } from '@/utils/constants';

const initialForm = {
  order_id: '',
  payment_method: 'bkash',
  amount: '',
  sender_number: '',
  sender_bank: '',
  account_number: '',
  transaction_reference: '',
  screenshot_url: '',
  note: '',
  card_holder: '',
  card_number: '',
  card_expiry: '',
  card_cvv: ''
};

const mobileMethods = new Set(['bkash', 'nagad', 'rocket', 'upay']);
const cardMethods = new Set(['visa', 'mastercard', 'amex']);

export default function BuyerTransactions() {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [context, setContext] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successTransaction, setSuccessTransaction] = useState(null);

  const load = async () => {
    const [sent, orderData] = await Promise.all([
      apiClient.transactions.mySent(1, 20),
      apiClient.entities.Order.list('-created_date', 30)
    ]);
    setTransactions(sent.items || []);
    setOrders(Array.isArray(orderData) ? orderData : []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const updateForm = (changes) => setForm((current) => ({ ...current, ...changes }));

  const selectOrder = async (orderId) => {
    updateForm({ order_id: orderId });
    setSuccessTransaction(null);
    try {
      const data = await apiClient.transactions.paymentContext(orderId);
      setContext(data);
      updateForm({ order_id: orderId, amount: String(data.total_amount || '') });
    } catch (error) {
      toast({ title: 'অর্ডারের তথ্য পাওয়া যায়নি', description: error.message, variant: 'destructive' });
    }
  };

  const selectedMethod = PAYMENT_METHOD_BY_ID[form.payment_method] || PAYMENT_METHOD_BY_ID.bkash;
  const isMobilePayment = mobileMethods.has(form.payment_method);
  const isBankPayment = form.payment_method === 'bank_transfer';
  const isCardPayment = cardMethods.has(form.payment_method);
  const isCod = form.payment_method === 'cash_on_delivery';

  const copy = async (value) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast({ title: 'তথ্য কপি করা হয়েছে' });
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await apiClient.upload(file, 'payments');
      updateForm({ screenshot_url: result.file_url });
      toast({ title: 'পেমেন্ট স্ক্রিনশট যোগ করা হয়েছে' });
    } catch (error) {
      toast({ title: 'ছবি আপলোড করা যায়নি', description: error.message, variant: 'destructive' });
    }
  };

  const selectedOrderLabel = useMemo(() => {
    const order = orders.find((item) => item.id === form.order_id);
    if (!order) return '';
    return `#${order.id.slice(-6)} · ${order.items?.[0]?.name || 'পণ্য'} · ${formatCurrency(order.total_amount)}`;
  }, [orders, form.order_id]);

  const submit = async () => {
    if (!form.order_id || !form.amount) {
      toast({ title: 'অর্ডার ও টাকার পরিমাণ দিন', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        note: isCardPayment
          ? [form.note, `Card UI only: ${selectedMethod.name}${form.card_holder ? `, Holder: ${form.card_holder}` : ''}`].filter(Boolean).join('\n')
          : form.note,
        account_number: isCardPayment ? form.card_number?.replace(/\s/g, '').slice(-4) : form.account_number,
        transaction_reference: isCardPayment && !form.transaction_reference
          ? `CARD-UI-${Date.now().toString(36).toUpperCase()}`
          : form.transaction_reference
      };
      const created = await apiClient.transactions.create(payload);
      toast({ title: 'পেমেন্ট তথ্য সফলভাবে পাঠানো হয়েছে।' });
      setSuccessTransaction(created);
      setForm(initialForm);
      setContext(null);
      await load();
    } catch (error) {
      toast({ title: 'পেমেন্ট তথ্য পাঠানো যায়নি', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <TransactionSkeleton />;

  return (
    <div className="space-y-7">
      <div className="animate-in fade-in-50">
        <p className="text-sm font-semibold text-primary">নিরাপদ পেমেন্ট</p>
        <h2 className="font-heading text-2xl font-black tracking-normal text-foreground">পেমেন্ট সম্পন্ন করুন</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">অর্ডার নির্বাচন করুন, পেমেন্ট পদ্ধতি বাছাই করুন এবং প্রয়োজনীয় তথ্য পাঠান।</p>
      </div>

      {successTransaction && (
        <PaymentSuccess transaction={successTransaction} onReset={() => setSuccessTransaction(null)} />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="order-2 space-y-6 xl:order-1">
          <section className="animate-in fade-in-50 rounded-lg border bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
              <label className="text-sm font-semibold">
                অর্ডার নির্বাচন করুন
                <Select value={form.order_id} onValueChange={selectOrder}>
                  <SelectTrigger className="mt-2 h-12 rounded-lg bg-white">
                    <SelectValue placeholder="পেমেন্টের জন্য অর্ডার বাছাই করুন">{selectedOrderLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        #{order.id.slice(-6)} · {order.items?.[0]?.name || 'পণ্য'} · {formatCurrency(order.total_amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <div className="rounded-lg bg-emerald-50 p-4 text-sm">
                <p className="text-muted-foreground">পরিশোধযোগ্য</p>
                <p className="text-2xl font-black text-primary">{formatCurrency(form.amount)}</p>
              </div>
            </div>
          </section>

          <section className="animate-in fade-in-50 rounded-lg border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col gap-1">
              <h3 className="font-heading text-xl font-bold">পেমেন্ট পদ্ধতি</h3>
              <p className="text-sm text-muted-foreground">আপনার সুবিধামতো একটি পদ্ধতি নির্বাচন করুন।</p>
            </div>
            <PaymentMethodSelector value={form.payment_method} onChange={(payment_method) => updateForm({ payment_method })} />
          </section>

          <section className="animate-in fade-in-50 rounded-lg border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <img src={selectedMethod.logo} alt={`${selectedMethod.name} logo`} className="h-10 w-24 rounded-md object-contain" />
              <div>
                <h3 className="font-heading text-xl font-bold">{selectedMethod.name} তথ্য</h3>
                <p className="text-sm text-muted-foreground">{selectedMethod.description}</p>
              </div>
            </div>

            {isCod ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-900">
                আপনার পণ্য ডেলিভারির সময় মূল্য পরিশোধ করবেন।
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {isMobilePayment && (
                  <>
                    <label className="text-sm font-medium">Sender Mobile Number<Input className="mt-1 h-11 rounded-lg" value={form.sender_number} onChange={(event) => updateForm({ sender_number: event.target.value })} placeholder="01XXXXXXXXX" /></label>
                    <label className="text-sm font-medium">Transaction ID<Input className="mt-1 h-11 rounded-lg" value={form.transaction_reference} onChange={(event) => updateForm({ transaction_reference: event.target.value })} placeholder="TXN123456" /></label>
                    <label className="text-sm font-medium">Amount<Input type="number" className="mt-1 h-11 rounded-lg" value={form.amount} onChange={(event) => updateForm({ amount: event.target.value })} /></label>
                  </>
                )}

                {isBankPayment && (
                  <>
                    <label className="text-sm font-medium">Bank Name<Input className="mt-1 h-11 rounded-lg" value={form.sender_bank} onChange={(event) => updateForm({ sender_bank: event.target.value })} /></label>
                    <label className="text-sm font-medium">Sender Account Number<Input className="mt-1 h-11 rounded-lg" value={form.account_number} onChange={(event) => updateForm({ account_number: event.target.value })} /></label>
                    <label className="text-sm font-medium">Transaction Reference<Input className="mt-1 h-11 rounded-lg" value={form.transaction_reference} onChange={(event) => updateForm({ transaction_reference: event.target.value })} /></label>
                    <label className="text-sm font-medium">Amount<Input type="number" className="mt-1 h-11 rounded-lg" value={form.amount} onChange={(event) => updateForm({ amount: event.target.value })} /></label>
                  </>
                )}

                {isCardPayment && (
                  <>
                    <label className="text-sm font-medium">Card Holder Name<Input className="mt-1 h-11 rounded-lg" value={form.card_holder} onChange={(event) => updateForm({ card_holder: event.target.value })} /></label>
                    <label className="text-sm font-medium">Card Number<Input className="mt-1 h-11 rounded-lg" inputMode="numeric" value={form.card_number} onChange={(event) => updateForm({ card_number: event.target.value })} placeholder="0000 0000 0000 0000" /></label>
                    <label className="text-sm font-medium">Expiry Date<Input className="mt-1 h-11 rounded-lg" value={form.card_expiry} onChange={(event) => updateForm({ card_expiry: event.target.value })} placeholder="MM/YY" /></label>
                    <label className="text-sm font-medium">CVV<Input className="mt-1 h-11 rounded-lg" inputMode="numeric" value={form.card_cvv} onChange={(event) => updateForm({ card_cvv: event.target.value })} placeholder="***" /></label>
                    <label className="text-sm font-medium sm:col-span-2">Amount<Input type="number" className="mt-1 h-11 rounded-lg" value={form.amount} onChange={(event) => updateForm({ amount: event.target.value })} /></label>
                  </>
                )}

                {!isCardPayment && (
                  <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-emerald-50/40 p-4 text-center text-sm font-medium text-primary transition hover:bg-emerald-50 sm:col-span-2">
                    <ImagePlus className="h-5 w-5" />
                    {form.screenshot_url ? 'ফাইল যোগ করা হয়েছে' : isBankPayment ? 'Upload Slip' : 'Upload Payment Screenshot (optional)'}
                    <input type="file" accept="image/*" className="hidden" onChange={upload} />
                  </label>
                )}

                {!isCardPayment && (
                  <label className="text-sm font-medium sm:col-span-2">Note<Textarea className="mt-1 min-h-24 rounded-lg" value={form.note} onChange={(event) => updateForm({ note: event.target.value })} /></label>
                )}
              </div>
            )}

            <Button onClick={submit} disabled={submitting || !context} className="mt-6 h-12 w-full rounded-lg bg-primary text-base font-bold hover:bg-emerald-700">
              {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
              {submitting ? 'পাঠানো হচ্ছে...' : 'পেমেন্ট তথ্য পাঠান'}
            </Button>
          </section>

          <SellerPaymentInfo context={context} onCopy={copy} />
        </div>

        <aside className="order-1 space-y-5 xl:order-2">
          <OrderSummaryCard order={context} />
        </aside>
      </div>

      <section className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h3 className="font-heading text-lg font-bold">আমার পাঠানো পেমেন্ট</h3>
        </div>
        {!transactions.length ? (
          <div className="p-6"><EmptyState icon={ReceiptText} title="এখনও কোনো পেমেন্ট পাঠানো হয়নি" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr><th className="p-3">কোড</th><th className="p-3">অর্ডার</th><th className="p-3">পদ্ধতি</th><th className="p-3">পরিমাণ</th><th className="p-3">অবস্থা</th><th className="p-3">তারিখ</th></tr>
              </thead>
              <tbody>
                {transactions.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3 font-medium">{item.transaction_code || item.id.slice(-8)}</td>
                    <td className="p-3">#{item.order_id?.slice(-6)}</td>
                    <td className="p-3">{paymentMethodLabel(item.payment_method)}</td>
                    <td className="p-3 font-semibold text-primary">{formatCurrency(item.amount)}</td>
                    <td className="p-3"><StatusBadge status={item.status} /></td>
                    <td className="p-3 text-muted-foreground">{formatDate(item.created_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
