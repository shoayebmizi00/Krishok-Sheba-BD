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

export default function AddListing() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    crop_name: '', quantity: '', unit: 'kg', expected_harvest_date: '',
    expected_price: '', location: '', district: '', description: '',
    listing_type: 'ready', images: []
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await apiClient.upload(file, 'crops');
    setForm(prev => ({ ...prev, images: [...prev.images, file_url] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.crop_name || !form.quantity || !form.expected_price || !form.district) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await apiClient.entities.CropListing.create({
      ...form,
      quantity: Number(form.quantity),
      expected_price: Number(form.expected_price),
      farmer_id: user?.id,
      farmer_name: user?.full_name || 'Farmer',
      status: 'active'
    });
    toast({ title: "Listing created!", description: "Your crop is now visible in the marketplace." });
    navigate('/farmer-dashboard/listings');
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-heading font-bold text-xl text-foreground mb-6">Add Crop Listing</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Crop Name *</label>
            <Input value={form.crop_name} onChange={e => handleChange('crop_name', e.target.value)} placeholder="e.g. Aman Rice" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Listing Type</label>
            <Select value={form.listing_type} onValueChange={v => handleChange('listing_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ready">Ready to Sell</SelectItem>
                <SelectItem value="pre_harvest">Pre-Harvest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Quantity *</label>
            <Input type="number" value={form.quantity} onChange={e => handleChange('quantity', e.target.value)} placeholder="500" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Unit</label>
            <Select value={form.unit} onValueChange={v => handleChange('unit', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                <SelectItem value="ton">Ton</SelectItem>
                <SelectItem value="maund">Maund</SelectItem>
                <SelectItem value="mon">Mon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Price (৳) *</label>
            <Input type="number" value={form.expected_price} onChange={e => handleChange('expected_price', e.target.value)} placeholder="28" className="mt-1" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">District *</label>
            <Select value={form.district} onValueChange={v => handleChange('district', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select district" /></SelectTrigger>
              <SelectContent>
                {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Expected Harvest Date</label>
            <Input type="date" value={form.expected_harvest_date} onChange={e => handleChange('expected_harvest_date', e.target.value)} className="mt-1" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Location Details</label>
          <Input value={form.location} onChange={e => handleChange('location', e.target.value)} placeholder="Village, Upazila" className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Description</label>
          <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Describe your crop quality, variety, etc." rows={4} className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Upload Images</label>
          <div className="mt-2 flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">Upload</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
          {submitting ? 'Creating...' : 'Create Listing'}
        </Button>
      </form>
    </div>
  );
}
