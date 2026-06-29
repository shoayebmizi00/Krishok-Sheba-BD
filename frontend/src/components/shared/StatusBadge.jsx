import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  available: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  in_transit: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  accepted: 'bg-green-100 text-green-700',
  sold: 'bg-gray-100 text-gray-700',
  expired: 'bg-gray-100 text-gray-700',
  sold_out: 'bg-gray-100 text-gray-700',
  rented: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-orange-100 text-orange-700',
  on_trip: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-red-100 text-red-700',
  countered: 'bg-indigo-100 text-indigo-700',
  inactive: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  received: 'bg-emerald-100 text-emerald-700',
  verified: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cod_pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-700',
};

export default function StatusBadge({ status }) {
  const t = useTranslation();
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {t(`status.${status}`, (status || '').replace(/_/g, ' '))}
    </span>
  );
}
