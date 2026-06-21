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
import SimplePagination from '@/components/shared/SimplePagination';

function TransportBookingDialog({ vehicle, user }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ pickup_location: '', delivery_location: '', pickup_date: '', cargo_description: '' });
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (!form.pickup_date) return setAvailability(null);
    setChecking(true);
    apiClient.availability.transport(vehicle.id, form.pickup_date)
      .then((result) => setAvailability(result.available))
      .catch(() => setAvailability(null))
      .finally(() => setChecking(false));
  }, [vehicle.id, form.pickup_date]);

  const handleBook = async () => {
    if (!form.pickup_location || !form.delivery_location || !form.pickup_date) return;
    try {
    await apiClient.entities.TransportBooking.create({
      vehicle_id: vehicle.id,
      vehicle_type: vehicle.vehicle_type,
      farmer_id: user?.id,
      farmer_name: user?.full_name || 'কৃষক',
      provider_id: vehicle.owner_id,
      ...form,
      estimated_cost: vehicle.price_per_km ? vehicle.price_per_km * 50 : 1000,
      status: 'pending'
    });
    toast({ title: "সফলভাবে পরিবহন বুকিংয়ের অনুরোধ পাঠানো হয়েছে" });
    setOpen(false);
    } catch (error) {
      toast({ title: 'বুকিং সম্পন্ন হয়নি', description: error.message || 'কিছু ভুল হয়েছে, আবার চেষ্টা করুন', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1"><Calendar className="w-3.5 h-3.5" /> এখনই বুক করুন</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>পরিবহন বুক করুন</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">পণ্য তোলার স্থান</label>
            <Input value={form.pickup_location} onChange={e => setForm(p => ({...p, pickup_location: e.target.value}))} placeholder="গ্রাম, উপজেলা, জেলা" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">পৌঁছানোর স্থান</label>
            <Input value={form.delivery_location} onChange={e => setForm(p => ({...p, delivery_location: e.target.value}))} placeholder="বাজার, জেলা" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">পিকআপের তারিখ</label>
            <Input type="date" value={form.pickup_date} onChange={e => setForm(p => ({...p, pickup_date: e.target.value}))} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">পণ্যের বিবরণ</label>
            <Textarea value={form.cargo_description} onChange={e => setForm(p => ({...p, cargo_description: e.target.value}))} placeholder="কী পরিবহন করবেন?" rows={2} className="mt-1" />
          </div>
          {form.pickup_date && <p className={`text-sm font-medium ${availability === false ? 'text-destructive' : 'text-primary'}`}>{checking ? 'উপলব্ধতা যাচাই হচ্ছে...' : availability === false ? 'বুকড — নির্বাচিত তারিখে উপলব্ধ নয়' : availability === true ? 'উপলব্ধ' : ''}</p>}
          <Button onClick={handleBook} disabled={!form.pickup_location || !form.delivery_location || !form.pickup_date || checking || availability === false} className="w-full bg-primary hover:bg-primary/90">
            বুকিং নিশ্চিত করুন
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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const data = await apiClient.entities.Vehicle.list('-created_date', PAGE_SIZE, page);
        setVehicles(data);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load transport options');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  const filtered = vehicles.filter(v => {
    const matchSearch = !search || (v.district || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || typeFilter === 'all' || v.vehicle_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-foreground">পরিবহন বুকিং</h1>
        <p className="text-muted-foreground text-sm mt-1">ফসল পরিবহনের জন্য পিকআপ, ট্রাক ও অন্যান্য যানবাহন বুক করুন</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="জেলা দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ধরনের যান</SelectItem>
            {VEHICLE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState icon={Truck} title="পরিবহন তথ্য পাওয়া যাচ্ছে না" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Truck} title="কোনো যানবাহন পাওয়া যায়নি" description="পরিবহন সেবাদাতারা যানবাহন যোগ করলে এখানে দেখা যাবে" />
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
                  <span className="text-sm font-bold text-primary">{formatCurrency(v.price_per_km)}/কিমি</span>
                  {v.availability === 'available' && <TransportBookingDialog vehicle={v} user={user} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <SimplePagination page={page} hasNext={vehicles.length === PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
