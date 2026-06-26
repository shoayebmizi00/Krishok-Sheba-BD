import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { DISTRICTS, EQUIPMENT_TYPES } from '@/utils/constants';
import { Upload } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';
import { useAppSettings } from '@/hooks/useAppSettings';

export default function AddEquipment() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'tractor', description: '', rent_price_per_day: '',
    sale_price: '', is_for_rent: true, is_for_sale: false, district: '', images: []
  });
  const { options: equipmentTypes } = useAppSettings('equipment_category', EQUIPMENT_TYPES);
  const { options: districts } = useAppSettings('district', DISTRICTS.map((district) => ({ value: district, label: district })));

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await apiClient.upload(file, 'equipment');
    setForm(prev => ({ ...prev, images: [...prev.images, file_url] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.district) {
      toast({ title: "প্রয়োজনীয় তথ্য পূরণ করুন", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await apiClient.entities.Equipment.create({
      ...form,
      rent_price_per_day: Number(form.rent_price_per_day) || 0,
      sale_price: Number(form.sale_price) || 0,
      owner_id: user?.id,
      owner_name: user?.full_name || 'মালিক',
      availability: 'available'
    });
    toast({ title: "যন্ত্রপাতি সফলভাবে যোগ হয়েছে" });
    navigate('/equipment-owner-dashboard/equipment');
  };

  return (
    <div className="max-w-2xl">
      <BackButton fallback="/equipment-owner-dashboard/equipment" />
      <h2 className="font-heading font-bold text-xl text-foreground mb-6">যন্ত্রপাতি যোগ করুন</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">যন্ত্রপাতির নাম *</label>
            <Input value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="যেমন: পাওয়ার টিলার" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">ধরন *</label>
            <Select value={form.type} onValueChange={v => handleChange('type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {equipmentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">জেলা *</label>
          <Select value={form.district} onValueChange={v => handleChange('district', v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="জেলা নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>
              {districts.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={form.is_for_rent} onCheckedChange={v => handleChange('is_for_rent', v)} />
            <label className="text-sm">ভাড়ার জন্য উপলব্ধ</label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_for_sale} onCheckedChange={v => handleChange('is_for_sale', v)} />
            <label className="text-sm">বিক্রির জন্য উপলব্ধ</label>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {form.is_for_rent && (
            <div>
              <label className="text-sm font-medium">দৈনিক ভাড়া (৳)</label>
              <Input type="number" value={form.rent_price_per_day} onChange={e => handleChange('rent_price_per_day', e.target.value)} className="mt-1" />
            </div>
          )}
          {form.is_for_sale && (
            <div>
              <label className="text-sm font-medium">বিক্রয় মূল্য (৳)</label>
              <Input type="number" value={form.sale_price} onChange={e => handleChange('sale_price', e.target.value)} className="mt-1" />
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">বিবরণ</label>
          <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={3} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">ছবি</label>
          <div className="mt-2 flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">আপলোড</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>
        <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
          {submitting ? 'যোগ হচ্ছে...' : 'যন্ত্রপাতি যোগ করুন'}
        </Button>
      </form>
    </div>
  );
}
