import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/constants';
import { paymentMethodLabel } from './paymentMethods';

export default function PaymentSuccess({ transaction, onReset }) {
  const navigate = useNavigate();

  return (
    <section className="animate-in fade-in-50 zoom-in-95 rounded-lg border bg-white p-6 text-center shadow-sm sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-primary">
        <CheckCircle2 className="h-9 w-9" />
      </div>
      <p className="mt-5 text-sm font-semibold text-primary">Payment Submitted Successfully</p>
      <h2 className="mt-2 font-heading text-2xl font-black">আপনার পেমেন্ট তথ্য সফলভাবে পাঠানো হয়েছে।</h2>

      <div className="mx-auto mt-6 grid max-w-2xl gap-3 rounded-lg bg-muted/40 p-4 text-left text-sm sm:grid-cols-2">
        <p><span className="block text-muted-foreground">Transaction ID</span><strong>{transaction?.transaction_reference || transaction?.transaction_code || 'N/A'}</strong></p>
        <p><span className="block text-muted-foreground">Amount</span><strong>{formatCurrency(transaction?.amount)}</strong></p>
        <p><span className="block text-muted-foreground">Payment Method</span><strong>{paymentMethodLabel(transaction?.payment_method)}</strong></p>
        <p><span className="block text-muted-foreground">Date</span><strong>{formatDate(transaction?.created_date || transaction?.created_at || new Date())}</strong></p>
      </div>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Button type="button" className="h-11" onClick={() => navigate('/buyer-dashboard/orders')}>অর্ডার দেখুন</Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => { onReset?.(); navigate('/buyer-dashboard'); }}>ড্যাশবোর্ডে ফিরে যান</Button>
      </div>
    </section>
  );
}
