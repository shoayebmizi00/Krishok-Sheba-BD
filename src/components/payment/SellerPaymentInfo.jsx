import React from 'react';
import { Check, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const sellerMethods = [
  ['bKash', 'bkash_number', '/assets/payment/bkash.svg'],
  ['Nagad', 'nagad_number', '/assets/payment/nagad.svg'],
  ['Rocket', 'rocket_number', '/assets/payment/rocket.svg'],
  ['Upay', 'upay_number', '/assets/payment/upay.svg']
];

function CopyButton({ value, onCopy }) {
  return (
    <Button type="button" size="sm" variant="outline" onClick={() => onCopy(value)} disabled={!value} className="shrink-0">
      <Clipboard className="mr-1 h-3.5 w-3.5" />
      কপি
    </Button>
  );
}

export default function SellerPaymentInfo({ context, onCopy }) {
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-primary">বিক্রেতার পেমেন্ট তথ্য</p>
        <h3 className="font-heading text-xl font-bold">{context?.seller_name || 'বিক্রেতা'}</h3>
      </div>

      {context ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {sellerMethods.map(([name, key, logo]) => (
            <div key={key} className="rounded-lg border bg-muted/20 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <img src={logo} alt={`${name} logo`} className="h-8 max-w-24 object-contain" />
                <CopyButton value={context[key]} onCopy={onCopy} />
              </div>
              <p className="text-xs text-muted-foreground">{name} Number</p>
              <p className="mt-1 font-semibold">{context[key] || 'যোগ করা হয়নি'}</p>
            </div>
          ))}

          <div className="rounded-lg border bg-muted/20 p-3 sm:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <img src="/assets/payment/bank.svg" alt="Bank logo" className="h-8 max-w-28 object-contain" />
              <CopyButton value={context.bank_account_number} onCopy={onCopy} />
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-muted-foreground">Account Name:</span> {context.account_holder_name || 'যোগ করা হয়নি'}</p>
              <p><span className="text-muted-foreground">Account Number:</span> {context.bank_account_number || 'যোগ করা হয়নি'}</p>
              <p><span className="text-muted-foreground">Bank Name:</span> {context.bank_name || 'যোগ করা হয়নি'}</p>
              <p><span className="text-muted-foreground">Branch:</span> {context.branch_name || 'যোগ করা হয়নি'}</p>
            </div>
          </div>

          <p className="flex gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 sm:col-span-2">
            <Check className="h-4 w-4 shrink-0" />
            টাকা পাঠানোর পর সঠিক রেফারেন্স ও প্রমাণ দিন। বিক্রেতা যাচাই করে পেমেন্ট গ্রহণ করবেন।
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">অর্ডার নির্বাচন করলে বিক্রেতার পেমেন্ট তথ্য দেখা যাবে।</p>
      )}
    </section>
  );
}
