import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Eye, MapPin, MessageSquare, Search, Star, Wrench, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import TransactionSkeleton from '@/components/payments/TransactionSkeleton';
import AddToCalendar from '@/components/shared/AddToCalendar';
import { DISTRICTS, EQUIPMENT_TYPES, formatCurrency, formatDate } from '@/utils/constants';
import fallbackImage from '@/assets/hero/hero-equipment.jpg';

const emptyForm = { start_date: '', end_date: '', quantity: '1', pickup_location: '', notes: '' };

export default function FarmerEquipmentBookings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bookingItem, setBookingItem] = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ search: '', type: 'all', district: 'all' });

  const load = async () => {
    const [catalog, history] = await Promise.all([
      apiClient.entities.Equipment.filter({ availability: 'available', approval_status: 'approved' }, '-created_date', 48),
      apiClient.bookings.equipment.my()
    ]);
    setEquipment(catalog); setBookings(history); setLoading(false);
  };
  useEffect(() => { load().catch(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!bookingItem || !form.start_date || !form.end_date) return setAvailability(null);
    apiClient.availability.equipment(bookingItem.id, form.start_date, form.end_date)
      .then((result) => setAvailability(result.available)).catch(() => setAvailability(null));
  }, [bookingItem, form.start_date, form.end_date]);

  const days = useMemo(() => {
    if (!form.start_date || !form.end_date || form.end_date < form.start_date) return 0;
    return Math.floor((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1;
  }, [form.start_date, form.end_date]);
  const filtered = useMemo(() => equipment.filter((item) => (
    (!filters.search || `${item.name} ${item.owner_name}`.toLowerCase().includes(filters.search.toLowerCase()))
    && (filters.type === 'all' || item.type === filters.type)
    && (filters.district === 'all' || item.district === filters.district)
  )), [equipment, filters]);

  const book = async () => {
    if (!days || !form.pickup_location || availability === false) {
      return toast({ title: 'তারিখ ও সংগ্রহের স্থান সঠিকভাবে দিন', variant: 'destructive' });
    }
    setSubmitting(true);
    try {
      await apiClient.bookings.equipment.create({ equipment_id: bookingItem.id, ...form, quantity: Number(form.quantity) });
      toast({ title: 'আপনার যন্ত্রপাতি বুকিং সফলভাবে জমা হয়েছে।' });
      setBookingItem(null); setForm(emptyForm); setAvailability(null);
      await load();
    } catch (error) {
      toast({ title: 'বুকিং জমা দেওয়া যায়নি', description: error.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };
  const cancel = async (booking) => {
    try {
      const updated = await apiClient.bookings.equipment.update(booking.id, { status: 'cancelled' });
      setBookings((items) => items.map((item) => item.id === booking.id ? { ...item, ...updated } : item));
      toast({ title: 'যন্ত্রপাতি বুকিং বাতিল করা হয়েছে।' });
    } catch (error) { toast({ title: 'বুকিং বাতিল করা যায়নি', description: error.message, variant: 'destructive' }); }
  };
  const messageOwner = async (booking) => {
    try {
      const conversation = await apiClient.messaging.createConversation({
        receiver_id: booking.owner_id,
        related_type: 'equipment_booking',
        related_id: booking.id,
        subject: booking.equipment_name
      });
      navigate(`/farmer/messages/${conversation.id}`);
    } catch (error) {
      toast({ title: 'কথোপকথন শুরু করা যায়নি', description: error.message, variant: 'destructive', duration: 3000 });
    }
  };
  if (loading) return <TransactionSkeleton />;

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-medium text-primary">ড্যাশবোর্ড থেকেই খুঁজুন ও বুক করুন</p><h2 className="font-heading text-2xl font-bold">যন্ত্রপাতি বুকিং</h2></div>
      <Tabs defaultValue="browse">
        <TabsList className="grid w-full max-w-md grid-cols-2"><TabsTrigger value="browse">যন্ত্রপাতি খুঁজুন</TabsTrigger><TabsTrigger value="history">আমার বুকিং ({bookings.length.toLocaleString('bn-BD')})</TabsTrigger></TabsList>
        <TabsContent value="browse" className="space-y-5 pt-4">
          <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-3">
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="নাম বা মালিক দিয়ে খুঁজুন" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
            <Select value={filters.type} onValueChange={(type) => setFilters({ ...filters, type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">সব বিভাগ</SelectItem>{EQUIPMENT_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
            <Select value={filters.district} onValueChange={(district) => setFilters({ ...filters, district })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">সব জেলা</SelectItem>{DISTRICTS.map((district) => <SelectItem key={district} value={district}>{district}</SelectItem>)}</SelectContent></Select>
          </div>
          {!filtered.length ? <EmptyState icon={Wrench} title="কোনো উপলব্ধ যন্ত্রপাতি পাওয়া যায়নি" /> : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <img src={item.images?.[0] || fallbackImage} onError={(e) => { e.currentTarget.src = fallbackImage; }} alt={item.name} loading="lazy" className="h-44 w-full object-cover" />
              <div className="space-y-3 p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-heading font-semibold">{item.name}</h3><p className="text-xs text-muted-foreground">{(item.type || 'অন্যান্য').replaceAll('_', ' ')}</p></div><StatusBadge status={item.availability} /></div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>মালিক: {item.owner_name || '—'}</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.district}</span><span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" />রেটিং যোগ হয়নি</span><strong className="text-primary">{formatCurrency(item.rent_price_per_day)}/দিন</strong></div>
                <div className="flex gap-2 border-t pt-3"><Button variant="outline" className="flex-1" onClick={() => setSelected(item)}><Eye className="mr-1 h-4 w-4" />বিস্তারিত দেখুন</Button><Button className="flex-1" onClick={() => { setBookingItem(item); setForm(emptyForm); }}><CalendarDays className="mr-1 h-4 w-4" />বুক করুন</Button></div>
              </div>
            </article>)}</div>
          )}
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          {!bookings.length ? <EmptyState icon={CalendarDays} title="এখনো কোনো যন্ত্রপাতি বুকিং নেই" /> : (
            <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full text-sm"><thead className="bg-muted/60 text-left"><tr><th className="p-3">বুকিং আইডি</th><th className="p-3">যন্ত্রপাতি / মালিক</th><th className="p-3">বুকিং তারিখ</th><th className="p-3">ভাড়ার সময়</th><th className="p-3">মোট খরচ</th><th className="p-3">অবস্থা</th><th className="p-3">পদক্ষেপ</th></tr></thead><tbody>{bookings.map((item) => <tr key={item.id} className="border-t"><td className="p-3">#{item.id.slice(-8)}</td><td className="p-3 font-medium">{item.equipment_name}<div className="text-xs text-muted-foreground">{item.owner_name || 'মালিক'}</div></td><td className="p-3">{formatDate(item.created_at)}</td><td className="p-3">{formatDate(item.start_date)} – {formatDate(item.end_date)}<div className="text-xs text-muted-foreground">{item.rental_days || '—'} দিন</div></td><td className="p-3 font-semibold text-primary">{formatCurrency(item.total_cost)}</td><td className="p-3"><StatusBadge status={item.status} /></td><td className="p-3"><div className="flex min-w-36 flex-col gap-1"><Button size="sm" variant="outline" onClick={() => setDetailBooking(item)}>বিস্তারিত</Button>{item.status === 'pending' && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancel(item)}><XCircle className="mr-1 h-4 w-4" />বাতিল করুন</Button>}<AddToCalendar title={`যন্ত্রপাতি বুকিং: ${item.equipment_name}`} startDate={item.start_date} endDate={item.end_date} /></div></td></tr>)}</tbody></table></div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>{selected && <div className="grid gap-5 sm:grid-cols-2"><img src={selected.images?.[0] || fallbackImage} alt={selected.name} className="h-64 w-full rounded-2xl object-cover" /><div className="space-y-3 text-sm"><StatusBadge status={selected.availability} /><p>{selected.description || 'বিস্তারিত বিবরণ দেওয়া হয়নি।'}</p><p><strong>ভাড়া:</strong> {formatCurrency(selected.rent_price_per_day)}/দিন</p><p><strong>মালিক:</strong> {selected.owner_name || '—'}</p><p><strong>জেলা:</strong> {selected.district}</p><p><strong>যোগাযোগ:</strong> বুকিং অনুমোদনের পর যোগাযোগের তথ্য দেখানো হবে।</p><Button onClick={() => { setBookingItem(selected); setSelected(null); }}>এখনই বুক করুন</Button></div></div>}</DialogContent></Dialog>

      <Dialog open={Boolean(bookingItem)} onOpenChange={(open) => !open && setBookingItem(null)}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{bookingItem?.name} বুক করুন</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">শুরুর তারিখ<Input type="date" className="mt-1" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label><label className="text-sm font-medium">শেষের তারিখ<Input type="date" className="mt-1" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></label><label className="text-sm font-medium">দিনের সংখ্যা<Input className="mt-1" value={days || ''} readOnly /></label><label className="text-sm font-medium">পরিমাণ<Input type="number" min="1" className="mt-1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label><label className="text-sm font-medium sm:col-span-2">সংগ্রহের স্থান<Input className="mt-1" value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} /></label><label className="text-sm font-medium sm:col-span-2">অতিরিক্ত নোট<Textarea className="mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label></div>{days > 0 && <div className="rounded-xl bg-primary/5 p-3 text-sm"><p>{availability === false ? 'নির্বাচিত তারিখে উপলব্ধ নয়' : availability === true ? 'নির্বাচিত তারিখে উপলব্ধ' : 'উপলব্ধতা যাচাই হচ্ছে...'}</p><strong>আনুমানিক মোট: {formatCurrency(days * Number(bookingItem?.rent_price_per_day || 0))}</strong></div>}<Button onClick={book} disabled={submitting || availability === false || !days} className="w-full">{submitting ? 'জমা হচ্ছে...' : 'বুকিং নিশ্চিত করুন'}</Button></DialogContent></Dialog>

      <Dialog open={Boolean(detailBooking)} onOpenChange={(open) => !open && setDetailBooking(null)}><DialogContent><DialogHeader><DialogTitle>বুকিং #{detailBooking?.id.slice(-8)}</DialogTitle></DialogHeader>{detailBooking && <div className="space-y-3 text-sm"><p><strong>যন্ত্রপাতি:</strong> {detailBooking.equipment_name}</p><p><strong>মালিক:</strong> {detailBooking.owner_name || '—'}</p><p><strong>সময়:</strong> {formatDate(detailBooking.start_date)} – {formatDate(detailBooking.end_date)}</p><p><strong>সংগ্রহের স্থান:</strong> {detailBooking.pickup_location || '—'}</p><p><strong>নোট:</strong> {detailBooking.notes || '—'}</p><p><strong>যোগাযোগ:</strong> {['approved','confirmed','active','completed'].includes(detailBooking.status) ? detailBooking.owner_phone || 'তথ্য দেওয়া হয়নি' : 'অনুমোদনের পর দেখা যাবে'}</p><StatusBadge status={detailBooking.status} /><Button variant="outline" className="w-full" onClick={() => messageOwner(detailBooking)}><MessageSquare className="mr-2 h-4 w-4" />মালিককে বার্তা দিন</Button></div>}</DialogContent></Dialog>
    </div>
  );
}
