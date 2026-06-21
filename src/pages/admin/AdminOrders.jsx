import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Package } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    const data = await apiClient.entities.Order.list('-created_date', 300);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (order, status) => {
    await apiClient.entities.Order.update(order.id, { status });
    toast({ title: 'অর্ডারের অবস্থা আপডেট হয়েছে' });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">সব অর্ডার</h2>

      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium text-muted-foreground">অর্ডার আইডি</th>
                <th className="p-3 font-medium text-muted-foreground">ক্রেতা</th>
                <th className="p-3 font-medium text-muted-foreground">বিক্রেতা</th>
                <th className="p-3 font-medium text-muted-foreground">টাকার পরিমাণ</th>
                <th className="p-3 font-medium text-muted-foreground">অবস্থা</th>
                <th className="p-3 font-medium text-muted-foreground">তারিখ</th>
                <th className="p-3 font-medium text-muted-foreground">পেমেন্ট</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs text-foreground">#{o.id?.slice(-6)}</td>
                  <td className="p-3 text-foreground">{o.buyer_name || 'Unknown'}</td>
                  <td className="p-3 text-muted-foreground">{o.seller_name || 'Unknown'}</td>
                  <td className="p-3 font-medium text-primary">{formatCurrency(o.total_amount)}</td>
                  <td className="p-3"><Select value={o.status} onValueChange={(status) => updateStatus(o, status)}><SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">অপেক্ষমাণ</SelectItem><SelectItem value="confirmed">নিশ্চিত</SelectItem><SelectItem value="processing">প্রক্রিয়াধীন</SelectItem><SelectItem value="shipped">পাঠানো হয়েছে</SelectItem><SelectItem value="delivered">ডেলিভারি সম্পন্ন</SelectItem><SelectItem value="cancelled">বাতিল</SelectItem></SelectContent></Select></td>
                  <td className="p-3 text-muted-foreground">{formatDate(o.created_date)}</td>
                  <td className="p-3"><StatusBadge status={o.payment_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
