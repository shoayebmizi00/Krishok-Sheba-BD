import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Check, Wrench, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/utils/constants';

export default function AdminEquipment() {
  const { toast } = useToast();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await apiClient.entities.Equipment.list('-created_date', 100);
    setEquipment(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await apiClient.entities.Equipment.delete(id);
    toast({ title: "যন্ত্রপাতি সরানো হয়েছে" });
    load();
  };
  const update = async (id, changes, title) => {
    await apiClient.entities.Equipment.update(id, changes);
    toast({ title });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">যন্ত্রপাতি ব্যবস্থাপনা</h2>

      {equipment.length === 0 ? (
        <EmptyState icon={Wrench} title="No equipment" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium text-muted-foreground">নাম</th>
                <th className="p-3 font-medium text-muted-foreground">ধরন</th>
                <th className="p-3 font-medium text-muted-foreground">মালিক</th>
                <th className="p-3 font-medium text-muted-foreground">জেলা</th>
                <th className="p-3 font-medium text-muted-foreground">দৈনিক ভাড়া</th>
                <th className="p-3 font-medium text-muted-foreground">অবস্থা</th>
                <th className="p-3 font-medium text-muted-foreground">অনুমোদন</th>
                <th className="p-3 font-medium text-muted-foreground">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map(eq => (
                <tr key={eq.id} className="border-t border-border">
                  <td className="p-3 font-medium text-foreground">{eq.name}</td>
                  <td className="p-3 text-muted-foreground capitalize">{(eq.type || '').replace('_', ' ')}</td>
                  <td className="p-3 text-muted-foreground">{eq.owner_name || 'Unknown'}</td>
                  <td className="p-3 text-muted-foreground">{eq.district}</td>
                  <td className="p-3 text-primary font-medium">{formatCurrency(eq.rent_price_per_day)}</td>
                  <td className="p-3"><StatusBadge status={eq.availability || 'available'} /></td>
                  <td className="p-3"><StatusBadge status={eq.approval_status || 'pending'} /></td>
                  <td className="p-3">
                    <Button variant="ghost" size="icon" onClick={() => update(eq.id, { approval_status: 'approved' }, 'যন্ত্রপাতির পোস্ট অনুমোদিত হয়েছে')} aria-label="অনুমোদন">
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => update(eq.id, { approval_status: 'rejected' }, 'যন্ত্রপাতির পোস্ট প্রত্যাখ্যান করা হয়েছে')} aria-label="প্রত্যাখ্যান">
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(eq.id)} className="text-destructive">
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
