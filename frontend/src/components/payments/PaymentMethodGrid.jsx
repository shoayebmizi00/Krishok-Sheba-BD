import React from 'react';
import { PAYMENT_METHOD_BY_ID } from './paymentMethods';
import PaymentMethodCard from './PaymentMethodCard';

export default function PaymentMethodGrid({ value, onChange, methodOptions = [] }) {
  const methods = methodOptions.map((option) => PAYMENT_METHOD_BY_ID[option.value] || {
    id: option.value,
    group: 'অন্যান্য',
    name: option.label,
    description: 'Configured payment method',
    logo: '/assets/payment/bank.svg',
    type: 'other'
  });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {methods.map((method) => (
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
