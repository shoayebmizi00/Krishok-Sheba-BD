import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import BackButton from '@/components/shared/BackButton';
import { Upload } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

export default function AddVehicle() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState('');
  const [form, setForm] = useState({
    vehicle_type: 'truck',
    capacity: '',
    price_per_km: '',
    district: '',
    description: ''
  });
  const { options: vehicleTypes } = useAppSettings('vehicle_category');
  const { options: districts } = useAppSettings('district');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const upload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const result = await apiClient.upload(file, 'vehicles');
    setImage(result.file_url);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiClient.entities.Vehicle.create({
        ...form,
        price_per_km: Number(form.price_per_km) || 0,
        images: image ? [image] : [],
        owner_id: user.id,
        owner_name: user.full_name || 'পরিবহন সেবাদাতা',
        availability: 'available'
      });
      toast({ title: 'যানবাহন সফলভাবে যোগ হয়েছে' });
      navigate('/transport-dashboard/vehicles');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-w-2xl">
      <BackButton fallback="/transport-dashboard/vehicles" />
      <h2 className="font-heading font-bold text-xl">যানবাহন যোগ করুন</h2>
      <Select value={form.vehicle_type} onValueChange={(value) => update('vehicle_type', value)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {vehicleTypes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input value={form.capacity} onChange={(e) => update('capacity', e.target.value)} placeholder="ধারণক্ষমতা, যেমন: ৫ টন" required />
        <Input type="number" min="0" step="0.01" value={form.price_per_km} onChange={(e) => update('price_per_km', e.target.value)} placeholder="প্রতি কিমি ভাড়া" required />
      </div>
      <Select value={form.district} onValueChange={(value) => update('district', value)}>
        <SelectTrigger><SelectValue placeholder="জেলা নির্বাচন করুন" /></SelectTrigger>
        <SelectContent>{districts.map((district) => <SelectItem key={district.value} value={district.value}>{district.label}</SelectItem>)}</SelectContent>
      </Select>
      <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="যানবাহনের বিবরণ" />
      <label className="relative inline-flex min-h-10 cursor-pointer touch-manipulation items-center justify-center gap-2 overflow-hidden rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent">
        <Upload className="pointer-events-none h-4 w-4" /> ছবি আপলোড করুন
        <input type="file" accept="image/*" onChange={upload} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      {image && <img src={image} alt="যানবাহনের ছবি" className="w-40 h-28 object-cover rounded-md border" />}
      <Button type="submit" disabled={saving || !form.district}>{saving ? 'সংরক্ষণ হচ্ছে...' : 'যানবাহন যোগ করুন'}</Button>
    </form>
  );
}
