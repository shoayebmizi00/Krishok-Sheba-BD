import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Plus, Trash2, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/constants';

export default function MyListings() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const data = await apiClient.entities.CropListing.filter({ farmer_id: user.id }, '-created_date');
    setListings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (id) => {
    await apiClient.entities.CropListing.delete(id);
    toast({ title: "Listing deleted" });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl text-foreground">My Crop Listings</h2>
        <Link to="/farmer-dashboard/add-listing">
          <Button className="bg-primary hover:bg-primary/90 gap-2"><Plus className="w-4 h-4" /> Add New</Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No listings yet"
          description="Start selling your crops by adding a listing"
          action={<Link to="/farmer-dashboard/add-listing"><Button className="bg-primary hover:bg-primary/90">Add Listing</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {listings.map(listing => (
            <div key={listing.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {listing.images?.[0]
                    ? <img src={listing.images[0]} alt={listing.crop_name} className="w-full h-full object-cover" />
                    : <span className="text-2xl">🌾</span>}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{listing.crop_name}</h3>
                  <p className="text-xs text-muted-foreground">{listing.district} · {listing.quantity} {listing.unit || 'kg'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={listing.status} />
                    <span className="text-xs text-muted-foreground capitalize">{listing.category || 'other'}</span>
                    <span className="text-xs text-muted-foreground capitalize">{(listing.listing_type || 'ready').replace('_', '-')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:ml-auto">
                <span className="font-bold text-primary">{formatCurrency(listing.expected_price)}/{listing.unit || 'kg'}</span>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(listing.id)} className="text-destructive hover:text-destructive">
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
