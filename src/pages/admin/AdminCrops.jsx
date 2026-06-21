import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Sprout, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/constants';

export default function AdminCrops() {
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await apiClient.entities.CropListing.list('-created_date', 100);
    setListings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await apiClient.entities.CropListing.delete(id);
    toast({ title: "ফসলের তালিকা সরানো হয়েছে" });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-xl text-foreground">ফসলের তালিকা ব্যবস্থাপনা</h2>

      {listings.length === 0 ? (
        <EmptyState icon={Sprout} title="No listings" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium text-muted-foreground">ফসল</th>
                <th className="p-3 font-medium text-muted-foreground">কৃষক</th>
                <th className="p-3 font-medium text-muted-foreground">জেলা</th>
                <th className="p-3 font-medium text-muted-foreground">মূল্য</th>
                <th className="p-3 font-medium text-muted-foreground">অবস্থা</th>
                <th className="p-3 font-medium text-muted-foreground">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(l => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-3 font-medium text-foreground">{l.crop_name}</td>
                  <td className="p-3 text-muted-foreground">{l.farmer_name || 'Unknown'}</td>
                  <td className="p-3 text-muted-foreground">{l.district}</td>
                  <td className="p-3 font-medium text-primary">{formatCurrency(l.expected_price)}</td>
                  <td className="p-3"><StatusBadge status={l.status} /></td>
                  <td className="p-3">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)} className="text-destructive">
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
