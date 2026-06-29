import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Wrench, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/utils/constants';

export default function MyEquipment() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const data = await apiClient.entities.Equipment.filter({ owner_id: user.id }, '-created_date');
    setEquipment(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (id) => {
    await apiClient.entities.Equipment.delete(id);
    toast({ title: "যন্ত্রপাতি সরানো হয়েছে" });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">আমার যন্ত্রপাতি</h2>

      {equipment.length === 0 ? (
        <EmptyState icon={Wrench} title="No equipment listed" description="Add your equipment to start receiving bookings" />
      ) : (
        <div className="space-y-3">
          {equipment.map(eq => (
            <div key={eq.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">🚜</div>
                <div>
                  <h3 className="font-medium text-foreground">{eq.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{(eq.type || '').replace('_', ' ')} · {eq.district}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {eq.rent_price_per_day && <span className="font-bold text-primary">{formatCurrency(eq.rent_price_per_day)}/day</span>}
                <StatusBadge status={eq.availability || 'available'} />
                <Button variant="ghost" size="icon" onClick={() => handleDelete(eq.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
