import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { useOutletContext } from 'react-router-dom';
import { Search, MapPin, Wrench, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { DISTRICTS, EQUIPMENT_TYPES, formatCurrency } from '@/lib/constants';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import SimplePagination from '@/components/shared/SimplePagination';

function BookingDialog({ equipment, user }) {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [open, setOpen] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate) {
      setAvailability(null);
      return;
    }
    setChecking(true);
    apiClient.availability.equipment(equipment.id, startDate, endDate)
      .then((result) => setAvailability(result.available))
      .catch(() => setAvailability(null))
      .finally(() => setChecking(false));
  }, [equipment.id, startDate, endDate]);

  const handleBook = async () => {
    if (!startDate || !endDate) return;
    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000));
    try {
      await apiClient.entities.EquipmentBooking.create({
        equipment_id: equipment.id, equipment_name: equipment.name, farmer_id: user?.id,
        farmer_name: user?.full_name || 'কৃষক', owner_id: equipment.owner_id,
        start_date: startDate, end_date: endDate,
        total_cost: days * (equipment.rent_price_per_day || 0), status: 'pending'
      });
      toast({ title: "সফলভাবে বুকিংয়ের অনুরোধ পাঠানো হয়েছে" });
      setOpen(false);
    } catch (error) {
      toast({ title: 'বুকিং সম্পন্ন হয়নি', description: error.message || 'কিছু ভুল হয়েছে, আবার চেষ্টা করুন', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1">
          <Calendar className="w-3.5 h-3.5" /> এখনই বুক করুন
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{equipment.name} বুক করুন</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">শুরুর তারিখ</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">শেষের তারিখ</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1" />
          </div>
          <p className="text-sm text-muted-foreground">ভাড়া: {formatCurrency(equipment.rent_price_per_day)}/দিন</p>
          {startDate && endDate && <p className={`text-sm font-medium ${availability === false ? 'text-destructive' : 'text-primary'}`}>{checking ? 'উপলব্ধতা যাচাই হচ্ছে...' : availability === false ? 'বুকড — নির্বাচিত তারিখে উপলব্ধ নয়' : availability === true ? 'উপলব্ধ' : ''}</p>}
          <Button onClick={handleBook} disabled={!startDate || !endDate || checking || availability === false} className="w-full bg-primary hover:bg-primary/90">
            বুকিং নিশ্চিত করুন
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Equipment() {
  const { user } = useOutletContext();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const data = await apiClient.entities.Equipment.list('-created_date', PAGE_SIZE, page);
        setEquipment(data);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load equipment');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  const filtered = equipment.filter(eq => {
    const matchSearch = !search || (eq.name || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || typeFilter === 'all' || eq.type === typeFilter;
    const matchDistrict = !districtFilter || districtFilter === 'all' || eq.district === districtFilter;
    return matchSearch && matchType && matchDistrict;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">কৃষি যন্ত্রপাতি ভাড়া ও বিক্রয়</h1>
          <p className="text-muted-foreground text-sm mt-1">ট্রাক্টর, হারভেস্টারসহ প্রয়োজনীয় কৃষি যন্ত্র খুঁজুন</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="যন্ত্রপাতি খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ধরনের যন্ত্র</SelectItem>
            {EQUIPMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={districtFilter} onValueChange={setDistrictFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Districts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব জেলা</SelectItem>
            {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState icon={Wrench} title="যন্ত্রপাতির তথ্য পাওয়া যাচ্ছে না" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="কোনো যন্ত্রপাতি পাওয়া যায়নি" description="মালিকেরা যন্ত্রপাতি যোগ করলে এখানে দেখা যাবে" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(eq => (
            <div key={eq.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
                {eq.images && eq.images.length > 0 ? (
                  <img src={eq.images[0]} alt={eq.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">🚜</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-foreground">{eq.name}</h3>
                  <StatusBadge status={eq.availability || 'available'} />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {eq.district}
                </div>
                <p className="text-xs text-muted-foreground capitalize mt-1">{(eq.type || '').replace('_', ' ')}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div>
                    {eq.is_for_rent && <span className="text-sm font-bold text-primary">{formatCurrency(eq.rent_price_per_day)}/দিন</span>}
                    {eq.is_for_sale && <span className="text-sm font-bold text-foreground ml-2">{formatCurrency(eq.sale_price)}</span>}
                  </div>
                  {eq.is_for_rent && eq.availability === 'available' && (
                    <BookingDialog equipment={eq} user={user} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <SimplePagination page={page} hasNext={equipment.length === PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
