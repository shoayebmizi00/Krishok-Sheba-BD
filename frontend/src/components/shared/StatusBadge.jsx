import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200',
  available: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200',
  in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200',
  sold: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  sold_out: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  rented: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200',
  maintenance: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200',
  on_trip: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200',
  refunded: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
  countered: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200',
  received: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
  verified: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
  cod_pending: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200',
};

export default function StatusBadge({ status }) {
  const t = useTranslation();
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {t(`status.${status}`, (status || '').replace(/_/g, ' '))}
    </span>
  );
}
