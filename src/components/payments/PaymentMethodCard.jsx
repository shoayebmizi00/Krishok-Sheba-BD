import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentMethodCard({ method, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex min-h-44 flex-col rounded-lg border bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg ${
        selected ? 'scale-[1.015] border-primary shadow-lg ring-2 ring-primary/15' : 'border-border'
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 rounded-full bg-primary p-1 text-primary-foreground shadow-sm">
          <CheckCircle2 className="h-4 w-4" />
        </span>
      )}
      <span className="mb-3 text-[11px] font-semibold text-muted-foreground">{method.group}</span>
      <span className="flex h-16 items-center justify-center rounded-md bg-muted/35 p-2">
        <img src={method.logo} alt={`${method.name} logo`} className="h-12 max-w-full object-contain" loading="lazy" />
      </span>
      <span className="mt-4 text-base font-bold text-foreground">{method.name}</span>
      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        {method.description}
      </span>
    </button>
  );
}
