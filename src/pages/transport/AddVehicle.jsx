import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { DISTRICTS } from '@/lib/constants';
import { Upload } from 'lucide-react';

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
        owner_name: user.full_name || 'Provider',
        availability: 'available'
      });
      toast({ title: 'Vehicle added' });
      navigate('/transport-dashboard/vehicles');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-w-2xl">
      <h2 className="font-heading font-bold text-xl">Add Vehicle</h2>
      <Select value={form.vehicle_type} onValueChange={(value) => update('vehicle_type', value)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="truck">Truck</SelectItem>
          <SelectItem value="mini_truck">Mini Truck</SelectItem>
          <SelectItem value="pickup_van">Pickup Van</SelectItem>
          <SelectItem value="three_wheeler">Three Wheeler</SelectItem>
        </SelectContent>
      </Select>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input value={form.capacity} onChange={(e) => update('capacity', e.target.value)} placeholder="Capacity, e.g. 5 tons" required />
        <Input type="number" min="0" step="0.01" value={form.price_per_km} onChange={(e) => update('price_per_km', e.target.value)} placeholder="Price per km" required />
      </div>
      <Select value={form.district} onValueChange={(value) => update('district', value)}>
        <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
        <SelectContent>{DISTRICTS.map((district) => <SelectItem key={district} value={district}>{district}</SelectItem>)}</SelectContent>
      </Select>
      <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Vehicle description" />
      <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium">
        <Upload className="w-4 h-4" /> Upload image
        <input type="file" accept="image/*" onChange={upload} className="hidden" />
      </label>
      {image && <img src={image} alt="Vehicle preview" className="w-40 h-28 object-cover rounded-md border" />}
      <Button type="submit" disabled={saving || !form.district}>{saving ? 'Saving...' : 'Add Vehicle'}</Button>
    </form>
  );
}
