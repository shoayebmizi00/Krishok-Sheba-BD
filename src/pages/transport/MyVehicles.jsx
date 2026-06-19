import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Plus, Truck, Trash2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/constants';

export default function MyVehicles() {
  const { user } = useOutletContext();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setVehicles(await apiClient.entities.Vehicle.filter({ owner_id: user.id }, '-created_date'));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id) => {
    await apiClient.entities.Vehicle.delete(id);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl">My Vehicles</h2>
        <Button asChild><Link to="/transport-dashboard/add"><Plus className="w-4 h-4 mr-2" />Add Vehicle</Link></Button>
      </div>
      {!vehicles.length ? <EmptyState icon={Truck} title="No vehicles" description="Add your first transport vehicle" /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="border rounded-lg bg-card p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-semibold capitalize">{vehicle.vehicle_type.replace('_', ' ')}</h3>
                  <p className="text-sm text-muted-foreground">{vehicle.capacity} · {vehicle.district}</p>
                  <p className="text-sm font-medium text-primary mt-2">{formatCurrency(vehicle.price_per_km)}/km</p>
                </div>
                <StatusBadge status={vehicle.availability} />
              </div>
              <Button variant="ghost" size="sm" className="text-destructive mt-3" onClick={() => remove(vehicle.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
