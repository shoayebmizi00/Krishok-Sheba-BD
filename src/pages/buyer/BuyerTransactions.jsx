import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { History } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function BuyerTransactions() {
  const { user } = useOutletContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ order_id: '', amount: '', payment_method: 'bkash', sender_account: '', reference: '' });
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [legacy, current, orderData] = await Promise.all([
        apiClient.entities.Transaction.filter({ user_id: user.id }, '-created_date'),
        apiClient.entities.Transaction.filter({ buyer_id: user.id }, '-created_date'),
        apiClient.entities.Order.filter({ buyer_id: user.id }, '-created_date')
      ]);
      setTransactions([...new Map([...legacy, ...current].map((item) => [item.id, item])).values()]);
      setOrders(orderData);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;
  const createTransaction = async () => {
    const order = orders.find((item) => item.id === form.order_id);
    if (!order || !form.amount) return;
    await apiClient.entities.Transaction.create({ ...form, amount: Number(form.amount), seller_id: order.seller_id, user_id: user.id, type: 'purchase', status: 'sent', counterparty_name: order.seller_name });
    toast({ title: 'লেনদেন রেকর্ড পাঠানো হয়েছে' });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">ক্রয় ও লেনদেনের ইতিহাস</h2>
      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5"><Select value={form.order_id} onValueChange={(value) => setForm({ ...form, order_id: value })}><SelectTrigger><SelectValue placeholder="অর্ডার নির্বাচন" /></SelectTrigger><SelectContent>{orders.map((order) => <SelectItem key={order.id} value={order.id}>#{order.id.slice(-6)} · {formatCurrency(order.total_amount)}</SelectItem>)}</SelectContent></Select><Input type="number" placeholder="টাকার পরিমাণ" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /><Select value={form.payment_method} onValueChange={(value) => setForm({ ...form, payment_method: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[['cash_on_delivery','ক্যাশ অন ডেলিভারি'],['bkash','বিকাশ'],['nagad','নগদ'],['rocket','রকেট'],['upay','উপায়'],['bank_transfer','ব্যাংক ট্রান্সফার'],['cash','নগদ টাকা']].map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Input placeholder="প্রেরক নম্বর/হিসাব" value={form.sender_account} onChange={(e) => setForm({ ...form, sender_account: e.target.value })} /><Button onClick={createTransaction}>পেমেন্ট রেকর্ড পাঠান</Button></div>

      {transactions.length === 0 ? (
        <EmptyState icon={History} title="No transactions" description="Your transaction history will appear here" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium text-muted-foreground">তারিখ</th>
                <th className="p-3 font-medium text-muted-foreground">বিবরণ</th>
                <th className="p-3 font-medium text-muted-foreground">টাকার পরিমাণ</th>
                <th className="p-3 font-medium text-muted-foreground">অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-3 text-muted-foreground">{formatDate(t.created_date)}</td>
                  <td className="p-3 text-foreground">{t.description || t.type}</td>
                  <td className="p-3 font-medium text-primary">{formatCurrency(t.amount)}</td>
                  <td className="p-3"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
