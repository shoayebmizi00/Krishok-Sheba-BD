import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { CROP_CATEGORIES, DISTRICTS } from '@/utils/constants';
import { Upload } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';
import { useAppSettings } from '@/hooks/useAppSettings';

export default function AddListing() {
  const { user } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    crop_name: '', category: '', quantity: '', unit: 'kg', expected_harvest_date: '',
    expected_price: '', location: '', district: '', description: '',
    listing_type: 'ready', images: []
  });
  const { options: cropCategories } = useAppSettings('crop_category', CROP_CATEGORIES);
  const { options: units } = useAppSettings('unit', [
    { value: 'kg', label: 'কেজি' }, { value: 'mon', label: 'মণ' },
    { value: 'ton', label: 'টন' }, { value: 'piece', label: 'পিস' }
  ]);
  const { options: districts } = useAppSettings('district', DISTRICTS.map((district) => ({ value: district, label: district })));
  useEffect(() => {
    if (!id) return;
    apiClient.entities.CropListing.filter({ id }, undefined, 1).then((rows) => {
      if (rows[0]) setForm({ ...rows[0], expected_harvest_date: rows[0].expected_harvest_date?.slice(0, 10) || '', images: rows[0].images || [] });
    });
  }, [id]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url, warning } = await apiClient.upload(file, 'crops');
      setForm(prev => ({ ...prev, images: [...prev.images, file_url] }));
      toast({
        title: 'ছবি সফলভাবে আপলোড হয়েছে',
        description: warning || 'ছবিটি আপনার ফসলের তালিকায় সংরক্ষিত হবে।'
      });
    } catch (error) {
      toast({
        title: 'ছবি আপলোড হয়নি',
        description: error.message || 'JPG, PNG অথবা WebP ছবি ব্যবহার করুন।',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.crop_name || !form.category || !form.quantity || !form.expected_price || !form.district || (form.listing_type === 'pre_harvest' && !form.expected_harvest_date)) {
      toast({ title: "প্রয়োজনীয় তথ্য পূরণ করুন", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        expected_harvest_date: form.listing_type === 'pre_harvest' ? form.expected_harvest_date : null,
        quantity: Number(form.quantity),
        total_quantity: Number(form.quantity),
        sold_quantity: Number(form.sold_quantity || 0),
        remaining_quantity: Math.max(Number(form.quantity) - Number(form.sold_quantity || 0), 0),
        expected_price: Number(form.expected_price),
        farmer_name: user?.full_name || 'Farmer',
        status: 'active'
      };
      if (id) await apiClient.entities.CropListing.update(id, payload);
      else await apiClient.entities.CropListing.create(payload);
      toast({ title: id ? "তালিকা হালনাগাদ হয়েছে" : "তালিকা তৈরি হয়েছে" });
      navigate('/farmer-dashboard/listings');
    } catch (error) {
      toast({
        title: 'তালিকা সংরক্ষণ করা যায়নি',
        description: error.message || 'আবার চেষ্টা করুন',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'farmer') {
    return <Navigate to="/marketplace" replace />;
  }

  return (
    <div className="max-w-2xl">
      <BackButton fallback="/farmer-dashboard/listings" />
      <h2 className="font-heading font-bold text-xl text-foreground mb-6">{id ? 'ফসলের তালিকা সম্পাদনা' : 'নতুন ফসলের তালিকা'}</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">ফসলের নাম *</label>
            <Input value={form.crop_name} onChange={e => handleChange('crop_name', e.target.value)} placeholder="যেমন: আমন ধান" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">ফসলের বিভাগ *</label>
            <Select value={form.category} onValueChange={v => handleChange('category', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="বিভাগ নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>
                {cropCategories.map(category => (
                  <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">তালিকার ধরন</label>
            <Select value={form.listing_type} onValueChange={v => handleChange('listing_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ready">বিক্রির জন্য প্রস্তুত</SelectItem>
                <SelectItem value="pre_harvest">আগাম ফসল</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">মোট পরিমাণ *</label>
            <Input type="number" value={form.quantity} onChange={e => handleChange('quantity', e.target.value)} placeholder="500" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">একক</label>
            <Select value={form.unit} onValueChange={v => handleChange('unit', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {units.map((unit) => <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">প্রতি এককের মূল্য (৳) *</label>
            <Input type="number" value={form.expected_price} onChange={e => handleChange('expected_price', e.target.value)} placeholder="28" className="mt-1" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">জেলা *</label>
            <Select value={form.district} onValueChange={v => handleChange('district', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select district" /></SelectTrigger>
              <SelectContent>
                {districts.map((district) => <SelectItem key={district.value} value={district.value}>{district.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.listing_type === 'pre_harvest' && <div>
            <label className="text-sm font-medium text-foreground">সম্ভাব্য ফসল কাটার তারিখ *</label>
            <Input required type="date" value={form.expected_harvest_date} onChange={e => handleChange('expected_harvest_date', e.target.value)} className="mt-1" />
          </div>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">ঠিকানার বিস্তারিত</label>
          <Input value={form.location} onChange={e => handleChange('location', e.target.value)} placeholder="গ্রাম, উপজেলা" className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">ফসলের বিবরণ</label>
          <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="ফসলের মান, জাত ও অন্যান্য তথ্য লিখুন" rows={4} className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">ছবি আপলোড করুন</label>
          <div className="mt-2 flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">আপলোড</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          {uploading && <p className="text-xs text-muted-foreground mt-2">ছবি আপলোড হচ্ছে...</p>}
        </div>

        <Button type="submit" disabled={submitting || uploading} className="bg-primary hover:bg-primary/90">
          {submitting ? 'সংরক্ষণ হচ্ছে...' : id ? 'পরিবর্তন সংরক্ষণ করুন' : 'তালিকা তৈরি করুন'}
        </Button>
      </form>
    </div>
  );
}
