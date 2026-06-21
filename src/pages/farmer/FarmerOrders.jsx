import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';

export default function FarmerOrders() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const data = await apiClient.entities.Order.filter({ seller_id: user.id }, '-created_date');
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const updateStatus = async (orderId, status) => {
    await apiClient.entities.Order.update(orderId, { status });
    const labels = { confirmed: 'অর্ডার নিশ্চিত হয়েছে', shipped: 'অর্ডার পাঠানো হয়েছে', delivered: 'অর্ডার পৌঁছেছে', cancelled: 'অর্ডার বাতিল হয়েছে' };
    toast({ title: labels[status] || 'অর্ডার হালনাগাদ হয়েছে' });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">অর্ডার</h2>

      {orders.length === 0 ? (
        <EmptyState icon={Package} title="এখনো কোনো অর্ডার নেই" description="ক্রেতাদের অর্ডার এখানে দেখা যাবে" />
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="p-4 rounded-xl border border-border bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">অর্ডার #{order.id?.slice(-6)}</h3>
                  <p className="text-sm text-muted-foreground">ক্রেতা: {order.buyer_name || 'অজানা'}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary">{formatCurrency(order.total_amount)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Select onValueChange={(v) => updateStatus(order.id, v)}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="অবস্থা পরিবর্তন করুন" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">নিশ্চিত করুন</SelectItem>
                      <SelectItem value="shipped">পাঠানো হয়েছে</SelectItem>
                      <SelectItem value="delivered">পৌঁছেছে</SelectItem>
                      <SelectItem value="cancelled">বাতিল করুন</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
