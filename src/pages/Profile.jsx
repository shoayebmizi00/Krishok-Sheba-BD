import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { DISTRICTS, ROLE_LABELS } from '@/lib/constants';
import { User, Save, Upload } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, setUser } = useOutletContext();
  const { toast } = useToast();
  const [form, setForm] = useState({
    phone: '', district: '', farm_name: '', land_size: '', crops_grown: '', profile_picture: ''
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setForm({
        phone: user.phone || '',
        district: user.district || '',
        farm_name: user.farm_name || '',
        land_size: user.land_size || '',
        crops_grown: user.crops_grown || '',
        profile_picture: user.profile_picture || ''
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await apiClient.upload(file, 'profiles');
    handleChange('profile_picture', file_url);
  };

  const handleSave = async () => {
    setSaving(true);
    await apiClient.auth.updateMe(form);
    const updatedUser = await apiClient.auth.me();
    setUser(updatedUser);
    toast({ title: "Profile updated!" });
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <EmptyState icon={User} title="Login required" description="Please login to view and edit your profile." />
        <Button asChild className="mt-4"><Link to="/login">Go to Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Profile Settings</h1>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            {form.profile_picture ? (
              <img src={form.profile_picture} alt="Profile" className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg">
              <Upload className="w-3.5 h-3.5 text-primary-foreground" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          <div>
            <h2 className="font-heading font-semibold text-lg text-foreground">{user?.full_name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+880 1XXXXXXXXX" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">District</label>
            <Select value={form.district} onValueChange={v => handleChange('district', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select district" /></SelectTrigger>
              <SelectContent>
                {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(user?.role === 'farmer') && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Farm Name</label>
                <Input value={form.farm_name} onChange={e => handleChange('farm_name', e.target.value)} placeholder="My Farm" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Land Size (acres)</label>
                <Input value={form.land_size} onChange={e => handleChange('land_size', e.target.value)} placeholder="2.5" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Crops Grown</label>
              <Input value={form.crops_grown} onChange={e => handleChange('crops_grown', e.target.value)} placeholder="Rice, Potato, Onion" className="mt-1" />
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
