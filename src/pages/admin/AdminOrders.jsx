import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Package } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await apiClient.entities.Order.list('-created_date', 100);
      setOrders(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">All Orders</h2>

      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium text-muted-foreground">Order ID</th>
                <th className="p-3 font-medium text-muted-foreground">Buyer</th>
                <th className="p-3 font-medium text-muted-foreground">Seller</th>
                <th className="p-3 font-medium text-muted-foreground">Amount</th>
                <th className="p-3 font-medium text-muted-foreground">Status</th>
                <th className="p-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs text-foreground">#{o.id?.slice(-6)}</td>
                  <td className="p-3 text-foreground">{o.buyer_name || 'Unknown'}</td>
                  <td className="p-3 text-muted-foreground">{o.seller_name || 'Unknown'}</td>
                  <td className="p-3 font-medium text-primary">{formatCurrency(o.total_amount)}</td>
                  <td className="p-3"><StatusBadge status={o.status} /></td>
                  <td className="p-3 text-muted-foreground">{formatDate(o.created_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
