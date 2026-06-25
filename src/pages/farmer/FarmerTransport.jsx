import React, { useEffect, useMemo, useState } from 'react';
import { Eye, MapPin, MessageSquare, Search, Truck, XCircle } from 'lucide-react';
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
import TransactionSkeleton from '@/components/payment/TransactionSkeleton';
import AddToCalendar from '@/components/shared/AddToCalendar';
import { VEHICLE_TYPES, formatCurrency, formatDate } from '@/lib/constants';
import fallbackImage from '@/assets/hero/hero-equipment.jpg';

const emptyForm = { pickup_location: '', delivery_location: '', product_name: '', quantity: '', pickup_date: '', preferred_time: '', cargo_description: '', additional_instructions: '' };

export default function FarmerTransport() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bookingVehicle, setBookingVehicle] = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [availability, setAvailability] = useState(null);
  const [filters, setFilters] = useState({ search: '', type: 'all' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const load = async () => {
    const [catalog, history] = await Promise.all([
      apiClient.entities.Vehicle.filter({ availability: 'available', approval_status: 'approved' }, '-created_date', 48),
      apiClient.bookings.transport.my()
    ]);
    setVehicles(catalog); setBookings(history); setLoading(false);
  };
  useEffect(() => { load().catch(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!bookingVehicle || !form.pickup_date) return setAvailability(null);
    apiClient.availability.transport(bookingVehicle.id, form.pickup_date)
      .then((result) => setAvailability(result.available)).catch(() => setAvailability(null));
  }, [bookingVehicle, form.pickup_date]);
  const filtered = useMemo(() => vehicles.filter((item) => (
    (!filters.search || `${item.district} ${item.owner_name}`.toLowerCase().includes(filters.search.toLowerCase()))
    && (filters.type === 'all' || item.vehicle_type === filters.type)
  )), [vehicles, filters]);
  const book = async () => {
    if (!form.pickup_location || !form.delivery_location || !form.product_name || !form.quantity || !form.pickup_date || availability === false) {
      return toast({ title: 'প্রয়োজনীয় পরিবহন তথ্য পূরণ করুন', variant: 'destructive' });
    }
    setSubmitting(true);
    try {
      await apiClient.bookings.transport.create({ vehicle_id: bookingVehicle.id, ...form });
      toast({ title: 'আপনার পরিবহন অনুরোধ সফলভাবে জমা হয়েছে।' });
      setBookingVehicle(null); setForm(emptyForm); setAvailability(null);
      await load();
    } catch (error) { toast({ title: 'পরিবহন অনুরোধ জমা দেওয়া যায়নি', description: error.message, variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };
  const cancel = async (booking) => {
    try {
      const updated = await apiClient.bookings.transport.update(booking.id, { status: 'cancelled' });
      setBookings((items) => items.map((item) => item.id === booking.id ? { ...item, ...updated } : item));
      toast({ title: 'পরিবহন অনুরোধ বাতিল করা হয়েছে।' });
    } catch (error) { toast({ title: 'অনুরোধ বাতিল করা যায়নি', description: error.message, variant: 'destructive' }); }
  };
  const messageProvider = async (booking) => {
    try {
      const conversation = await apiClient.messaging.createConversation({
        receiver_id: booking.provider_id,
        related_type: 'transport_booking',
        related_id: booking.id,
        subject: `${booking.pickup_location} → ${booking.delivery_location}`
      });
      navigate(`/farmer/messages/${conversation.id}`);
    } catch (error) {
      toast({ title: 'কথোপকথন শুরু করা যায়নি', description: error.message, variant: 'destructive', duration: 3000 });
    }
  };
  if (loading) return <TransactionSkeleton />;

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-medium text-primary">ফসল পরিবহনের ব্যবস্থা এক জায়গায়</p><h2 className="font-heading text-2xl font-bold">পরিবহন অনুরোধ</h2></div>
      <Tabs defaultValue="browse"><TabsList className="grid w-full max-w-md grid-cols-2"><TabsTrigger value="browse">যানবাহন খুঁজুন</TabsTrigger><TabsTrigger value="history">আমার অনুরোধ ({bookings.length.toLocaleString('bn-BD')})</TabsTrigger></TabsList>
        <TabsContent value="browse" className="space-y-5 pt-4">
          <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1fr_240px]"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="জেলা বা মালিক দিয়ে খুঁজুন" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div><Select value={filters.type} onValueChange={(type) => setFilters({ ...filters, type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">সব ধরনের যান</SelectItem>{VEHICLE_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          {!filtered.length ? <EmptyState icon={Truck} title="কোনো উপলব্ধ যানবাহন পাওয়া যায়নি" /> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><img src={item.images?.[0] || fallbackImage} onError={(e) => { e.currentTarget.src = fallbackImage; }} alt={item.vehicle_type} loading="lazy" className="h-44 w-full object-cover" /><div className="space-y-3 p-4"><div className="flex justify-between gap-2"><div><h3 className="font-heading font-semibold">{(item.vehicle_type || 'যানবাহন').replaceAll('_', ' ')}</h3><p className="text-xs text-muted-foreground">ধারণক্ষমতা: {item.capacity || 'উল্লেখ নেই'}</p></div><StatusBadge status={item.availability} /></div><div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.district}</span><span>মালিক: {item.owner_name || '—'}</span><strong className="text-primary">{formatCurrency(item.price_per_km)}/কিমি</strong></div><div className="flex gap-2 border-t pt-3"><Button variant="outline" className="flex-1" onClick={() => setSelected(item)}><Eye className="mr-1 h-4 w-4" />বিস্তারিত</Button><Button className="flex-1" onClick={() => { setBookingVehicle(item); setForm(emptyForm); }}>বুক করুন</Button></div></div></article>)}</div>}
        </TabsContent>
        <TabsContent value="history" className="pt-4">{!bookings.length ? <EmptyState icon={Truck} title="এখনো কোনো পরিবহন অনুরোধ নেই" /> : <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full text-sm"><thead className="bg-muted/60 text-left"><tr><th className="p-3">অনুরোধ আইডি</th><th className="p-3">যান / মালিক</th><th className="p-3">রুট</th><th className="p-3">বুকিং তারিখ</th><th className="p-3">অবস্থা</th><th className="p-3">পদক্ষেপ</th></tr></thead><tbody>{bookings.map((item) => <tr key={item.id} className="border-t"><td className="p-3">#{item.id.slice(-8)}</td><td className="p-3 font-medium">{(item.vehicle_type || '').replaceAll('_', ' ')}<div className="text-xs text-muted-foreground">{item.provider_name || 'পরিবহন মালিক'}</div></td><td className="p-3">{item.pickup_location}<div className="text-xs text-muted-foreground">→ {item.delivery_location}</div></td><td className="p-3">{formatDate(item.pickup_date)} {item.preferred_time?.slice(0,5) || ''}</td><td className="p-3"><StatusBadge status={item.status} /></td><td className="p-3"><div className="flex min-w-32 flex-col gap-1"><Button size="sm" variant="outline" onClick={() => setDetailBooking(item)}>দেখুন</Button>{item.status === 'pending' && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancel(item)}><XCircle className="mr-1 h-4 w-4" />বাতিল</Button>}<AddToCalendar title={`পরিবহন: ${item.pickup_location} থেকে ${item.delivery_location}`} startDate={item.pickup_date} endDate={item.pickup_date} /></div></td></tr>)}</tbody></table></div>}</TabsContent>
      </Tabs>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{selected && (selected.vehicle_type || '').replaceAll('_', ' ')}</DialogTitle></DialogHeader>{selected && <div className="grid gap-5 sm:grid-cols-2"><img src={selected.images?.[0] || fallbackImage} alt="" className="h-64 w-full rounded-2xl object-cover" /><div className="space-y-3 text-sm"><StatusBadge status={selected.availability} /><p>{selected.description || 'বিস্তারিত বিবরণ দেওয়া হয়নি।'}</p><p><strong>ধারণক্ষমতা:</strong> {selected.capacity || '—'}</p><p><strong>জেলা:</strong> {selected.district}</p><p><strong>মালিক:</strong> {selected.owner_name || '—'}</p><p><strong>হার:</strong> {formatCurrency(selected.price_per_km)}/কিমি</p><Button onClick={() => { setBookingVehicle(selected); setSelected(null); }}>পরিবহন বুক করুন</Button></div></div>}</DialogContent></Dialog>

      <Dialog open={Boolean(bookingVehicle)} onOpenChange={(open) => !open && setBookingVehicle(null)}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>পরিবহন বুক করুন</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">পণ্য তোলার স্থান<Input className="mt-1" value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} /></label><label className="text-sm font-medium">গন্তব্য<Input className="mt-1" value={form.delivery_location} onChange={(e) => setForm({ ...form, delivery_location: e.target.value })} /></label><label className="text-sm font-medium">পণ্য/ফসলের নাম<Input className="mt-1" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} /></label><label className="text-sm font-medium">পরিমাণ<Input className="mt-1" placeholder="যেমন: ২ টন" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label><label className="text-sm font-medium">পছন্দের তারিখ<Input type="date" className="mt-1" value={form.pickup_date} onChange={(e) => setForm({ ...form, pickup_date: e.target.value })} /></label><label className="text-sm font-medium">পছন্দের সময়<Input type="time" className="mt-1" value={form.preferred_time} onChange={(e) => setForm({ ...form, preferred_time: e.target.value })} /></label><label className="text-sm font-medium sm:col-span-2">পণ্যের বিবরণ<Textarea className="mt-1" value={form.cargo_description} onChange={(e) => setForm({ ...form, cargo_description: e.target.value })} /></label><label className="text-sm font-medium sm:col-span-2">অতিরিক্ত নির্দেশনা<Textarea className="mt-1" value={form.additional_instructions} onChange={(e) => setForm({ ...form, additional_instructions: e.target.value })} /></label></div>{form.pickup_date && <p className={`rounded-xl p-3 text-sm ${availability === false ? 'bg-destructive/10 text-destructive' : 'bg-primary/5 text-primary'}`}>{availability === false ? 'নির্বাচিত তারিখে যানটি উপলব্ধ নয়' : availability === true ? 'নির্বাচিত তারিখে যানটি উপলব্ধ' : 'উপলব্ধতা যাচাই হচ্ছে...'}</p>}<Button onClick={book} disabled={submitting || availability === false} className="w-full">{submitting ? 'জমা হচ্ছে...' : 'পরিবহন বুক করুন'}</Button></DialogContent></Dialog>

      <Dialog open={Boolean(detailBooking)} onOpenChange={(open) => !open && setDetailBooking(null)}><DialogContent><DialogHeader><DialogTitle>পরিবহন অনুরোধ #{detailBooking?.id.slice(-8)}</DialogTitle></DialogHeader>{detailBooking && <div className="space-y-3 text-sm"><p><strong>যান:</strong> {(detailBooking.vehicle_type || '').replaceAll('_', ' ')}</p><p><strong>মালিক:</strong> {detailBooking.provider_name || '—'}</p><p><strong>রুট:</strong> {detailBooking.pickup_location} → {detailBooking.delivery_location}</p><p><strong>ফসল:</strong> {detailBooking.product_name || '—'} ({detailBooking.quantity || '—'})</p><p><strong>তারিখ:</strong> {formatDate(detailBooking.pickup_date)} {detailBooking.preferred_time?.slice(0,5) || ''}</p><p><strong>নির্দেশনা:</strong> {detailBooking.additional_instructions || '—'}</p><p><strong>যোগাযোগ:</strong> {['accepted','confirmed','in_transit','completed','delivered'].includes(detailBooking.status) ? detailBooking.provider_phone || 'তথ্য দেওয়া হয়নি' : 'অনুরোধ গ্রহণের পর দেখা যাবে'}</p><StatusBadge status={detailBooking.status} /><Button variant="outline" className="w-full" onClick={() => messageProvider(detailBooking)}><MessageSquare className="mr-2 h-4 w-4" />সেবাদাতাকে বার্তা দিন</Button></div>}</DialogContent></Dialog>
    </div>
  );
}
