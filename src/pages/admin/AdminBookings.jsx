import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/constants';

function BookingTable({ rows, type }) {
  if (!rows.length) return <EmptyState icon={CalendarDays} title="কোনো বুকিং পাওয়া যায়নি" />;
  const equipment = type === 'equipment';
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr><th className="p-3">{equipment ? 'যন্ত্রপাতি' : 'যানবাহন'}</th><th className="p-3">কৃষক</th><th className="p-3">{equipment ? 'মালিক' : 'সেবাদাতা'}</th><th className="p-3">তারিখ/রুট</th><th className="p-3">খরচ</th><th className="p-3">অবস্থা</th></tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-3 font-medium">{equipment ? item.equipment_name : item.vehicle_type}</td>
              <td className="p-3">{item.farmer_name || item.farmer_id?.slice(-6)}</td>
              <td className="p-3">{(equipment ? item.owner_id : item.provider_id)?.slice(-6)}</td>
              <td className="p-3 text-muted-foreground">{equipment ? `${formatDate(item.start_date)} — ${formatDate(item.end_date)}` : `${item.pickup_location} → ${item.delivery_location}`}</td>
              <td className="p-3 font-medium text-primary">{formatCurrency(equipment ? item.total_cost : item.estimated_cost)}</td>
              <td className="p-3"><StatusBadge status={item.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminBookings() {
  const [equipmentBookings, setEquipmentBookings] = useState([]);
  const [transportBookings, setTransportBookings] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.entities.EquipmentBooking.list('-created_date', 300),
      apiClient.entities.TransportBooking.list('-created_date', 300)
    ]).then(([equipment, transport]) => {
      setEquipmentBookings(equipment);
      setTransportBookings(transport);
    }).finally(() => setLoading(false));
  }, []);

  const filterRows = (rows) => status === 'all' ? rows : rows.filter((item) => item.status === status);
  const equipmentRows = useMemo(() => filterRows(equipmentBookings), [equipmentBookings, status]);
  const transportRows = useMemo(() => filterRows(transportBookings), [transportBookings, status]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><h2 className="font-heading text-xl font-bold">বুকিং ব্যবস্থাপনা</h2><p className="text-sm text-muted-foreground">যন্ত্রপাতি ও পরিবহন বুকিং এক জায়গা থেকে পর্যবেক্ষণ করুন</p></div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব অবস্থা</SelectItem><SelectItem value="pending">অপেক্ষমাণ</SelectItem><SelectItem value="confirmed">নিশ্চিত</SelectItem><SelectItem value="active">চলমান</SelectItem><SelectItem value="completed">সম্পন্ন</SelectItem><SelectItem value="cancelled">বাতিল</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Tabs defaultValue="equipment">
        <TabsList><TabsTrigger value="equipment">যন্ত্রপাতি ({equipmentRows.length})</TabsTrigger><TabsTrigger value="transport">পরিবহন ({transportRows.length})</TabsTrigger></TabsList>
        <TabsContent value="equipment" className="mt-4"><BookingTable rows={equipmentRows} type="equipment" /></TabsContent>
        <TabsContent value="transport" className="mt-4"><BookingTable rows={transportRows} type="transport" /></TabsContent>
      </Tabs>
    </div>
  );
}
