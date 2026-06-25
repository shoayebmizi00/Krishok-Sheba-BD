import React from 'react';
import { Banknote, Building2, Smartphone, Truck } from 'lucide-react';

const methods = [
  ['cash_on_delivery', 'ক্যাশ অন ডেলিভারি', Truck],
  ['bkash', 'বিকাশ', Smartphone],
  ['nagad', 'নগদ', Smartphone],
  ['rocket', 'রকেট', Smartphone],
  ['upay', 'উপায়', Smartphone],
  ['bank_transfer', 'ব্যাংক ট্রান্সফার', Building2],
  ['cash', 'নগদ টাকা', Banknote]
];

export default function PaymentMethodSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {methods.map(([id, label, Icon]) => (
        <button key={id} type="button" onClick={() => onChange(id)}
          className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-medium transition ${
            value === id ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20' : 'bg-card hover:border-primary/40'
          }`}>
          <Icon className="h-6 w-6" />
          {label}
        </button>
      ))}
    </div>
  );
}
