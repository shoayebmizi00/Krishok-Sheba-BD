import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Wrench, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/constants';

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
    toast({ title: "Equipment removed" });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">Equipment Management</h2>

      {equipment.length === 0 ? (
        <EmptyState icon={Wrench} title="No equipment" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium text-muted-foreground">Name</th>
                <th className="p-3 font-medium text-muted-foreground">Type</th>
                <th className="p-3 font-medium text-muted-foreground">Owner</th>
                <th className="p-3 font-medium text-muted-foreground">District</th>
                <th className="p-3 font-medium text-muted-foreground">Rent/Day</th>
                <th className="p-3 font-medium text-muted-foreground">Status</th>
                <th className="p-3 font-medium text-muted-foreground">Action</th>
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
                  <td className="p-3">
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
