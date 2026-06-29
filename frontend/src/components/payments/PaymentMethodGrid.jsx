import React from 'react';
import { PAYMENT_METHODS } from './paymentMethods';
import PaymentMethodCard from './PaymentMethodCard';

export default function PaymentMethodGrid({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {PAYMENT_METHODS.map((method) => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          selected={value === method.id}
          onSelect={() => onChange(method.id)}
        />
      ))}
    </div>
  );
}
