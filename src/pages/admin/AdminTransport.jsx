import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Truck, Trash2 } from 'lucide-react';
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
    toast({ title: "Vehicle removed" });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">Transport Management</h2>

      {vehicles.length === 0 ? (
        <EmptyState icon={Truck} title="No vehicles" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium text-muted-foreground">Type</th>
                <th className="p-3 font-medium text-muted-foreground">Owner</th>
                <th className="p-3 font-medium text-muted-foreground">District</th>
                <th className="p-3 font-medium text-muted-foreground">Capacity</th>
                <th className="p-3 font-medium text-muted-foreground">Rate/km</th>
                <th className="p-3 font-medium text-muted-foreground">Status</th>
                <th className="p-3 font-medium text-muted-foreground">Action</th>
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
                  <td className="p-3">
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
