import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { useOutletContext } from 'react-router-dom';
import { Search, MapPin, Truck, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { VEHICLE_TYPES, formatCurrency } from '@/lib/constants';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

function TransportBookingDialog({ vehicle, user }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ pickup_location: '', delivery_location: '', pickup_date: '', cargo_description: '' });

  const handleBook = async () => {
    if (!form.pickup_location || !form.delivery_location || !form.pickup_date) return;
    await apiClient.entities.TransportBooking.create({
      vehicle_id: vehicle.id,
      vehicle_type: vehicle.vehicle_type,
      farmer_id: user?.id,
      farmer_name: user?.full_name || 'Farmer',
      provider_id: vehicle.owner_id,
      ...form,
      estimated_cost: vehicle.price_per_km ? vehicle.price_per_km * 50 : 1000,
      status: 'pending'
    });
    toast({ title: "Transport booked!", description: "The transport provider will confirm your request." });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1"><Calendar className="w-3.5 h-3.5" /> Book</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Book Transport</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Pickup Location</label>
            <Input value={form.pickup_location} onChange={e => setForm(p => ({...p, pickup_location: e.target.value}))} placeholder="Village, Upazila, District" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Delivery Location</label>
            <Input value={form.delivery_location} onChange={e => setForm(p => ({...p, delivery_location: e.target.value}))} placeholder="Market, District" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Pickup Date</label>
            <Input type="date" value={form.pickup_date} onChange={e => setForm(p => ({...p, pickup_date: e.target.value}))} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Cargo Description</label>
            <Textarea value={form.cargo_description} onChange={e => setForm(p => ({...p, cargo_description: e.target.value}))} placeholder="What are you transporting?" rows={2} className="mt-1" />
          </div>
          <Button onClick={handleBook} disabled={!form.pickup_location || !form.delivery_location || !form.pickup_date} className="w-full bg-primary hover:bg-primary/90">
            Confirm Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Transport() {
  const { user } = useOutletContext();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const data = await apiClient.entities.Vehicle.list('-created_date', 50);
        setVehicles(data);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load transport options');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = vehicles.filter(v => {
    const matchSearch = !search || (v.district || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || typeFilter === 'all' || v.vehicle_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-foreground">Transport Booking</h1>
        <p className="text-muted-foreground text-sm mt-1">Book pickup vans, trucks, and more for your harvest</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by district..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {VEHICLE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState icon={Truck} title="Transport unavailable" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Truck} title="No vehicles found" description="Transport providers will list their vehicles here" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(v => (
            <div key={v.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-36 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <span className="text-5xl">🚛</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-foreground capitalize">{(v.vehicle_type || '').replace('_', ' ')}</h3>
                  <StatusBadge status={v.availability || 'available'} />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {v.district}
                </div>
                {v.capacity && <p className="text-xs text-muted-foreground mt-1">Capacity: {v.capacity}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-sm font-bold text-primary">{formatCurrency(v.price_per_km)}/km</span>
                  {v.availability === 'available' && <TransportBookingDialog vehicle={v} user={user} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
