import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Check, Truck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/constants';

export default function AdminTransport() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await apiClient.entities.Vehicle.list('-created_date', 100);
    setVehicles(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await apiClient.entities.Vehicle.delete(id);
    toast({ title: "যানবাহন সরানো হয়েছে" });
    load();
  };
  const update = async (id, changes, title) => {
    await apiClient.entities.Vehicle.update(id, changes);
    toast({ title });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">পরিবহন ব্যবস্থাপনা</h2>

      {vehicles.length === 0 ? (
        <EmptyState icon={Truck} title="No vehicles" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium text-muted-foreground">ধরন</th>
                <th className="p-3 font-medium text-muted-foreground">মালিক</th>
                <th className="p-3 font-medium text-muted-foreground">জেলা</th>
                <th className="p-3 font-medium text-muted-foreground">ধারণক্ষমতা</th>
                <th className="p-3 font-medium text-muted-foreground">প্রতি কিমি ভাড়া</th>
                <th className="p-3 font-medium text-muted-foreground">অবস্থা</th>
                <th className="p-3 font-medium text-muted-foreground">অনুমোদন</th>
                <th className="p-3 font-medium text-muted-foreground">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} className="border-t border-border">
                  <td className="p-3 font-medium text-foreground capitalize">{(v.vehicle_type || '').replace('_', ' ')}</td>
                  <td className="p-3 text-muted-foreground">{v.owner_name || 'Unknown'}</td>
                  <td className="p-3 text-muted-foreground">{v.district}</td>
                  <td className="p-3 text-muted-foreground">{v.capacity || 'N/A'}</td>
                  <td className="p-3 text-primary font-medium">{formatCurrency(v.price_per_km)}</td>
                  <td className="p-3"><StatusBadge status={v.availability || 'available'} /></td>
                  <td className="p-3"><StatusBadge status={v.approval_status || 'pending'} /></td>
                  <td className="p-3">
                    <Button variant="ghost" size="icon" onClick={() => update(v.id, { approval_status: 'approved' }, 'যানবাহনের পোস্ট অনুমোদিত হয়েছে')} aria-label="অনুমোদন">
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => update(v.id, { approval_status: 'rejected' }, 'যানবাহনের পোস্ট প্রত্যাখ্যান করা হয়েছে')} aria-label="প্রত্যাখ্যান">
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
