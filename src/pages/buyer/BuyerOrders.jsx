import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Package } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';

export default function BuyerOrders() {
  const { user } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const data = await apiClient.entities.Order.filter({ buyer_id: user.id }, '-created_date');
      setOrders(data);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">My Orders</h2>

      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" description="Your purchases will appear here" />
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-foreground">Order #{order.id?.slice(-6)}</h3>
                <p className="text-sm text-muted-foreground">Seller: {order.seller_name || 'Farmer'}</p>
                <p className="text-xs text-muted-foreground">{formatDate(order.created_date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary">{formatCurrency(order.total_amount)}</span>
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
