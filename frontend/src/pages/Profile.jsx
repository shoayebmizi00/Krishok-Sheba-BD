import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Building2, Edit3, Save, Smartphone, Upload, User, X } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import EmptyState from '@/components/shared/EmptyState';
import BackButton from '@/components/shared/BackButton';
import { ROLE_LABELS } from '@/utils/constants';

const standardProfileFields = [['phone', 'ফোন নম্বর'], ['district', 'জেলা'], ['farm_name', 'খামারের নাম'], ['land_size', 'জমির পরিমাণ (একর)'], ['crops_grown', 'চাষ করা ফসল']];
const adminProfileFields = [['full_name', 'নাম'], ['phone', 'ফোন নম্বর']];
const fieldsForRole = (role) => role === 'admin' ? adminProfileFields : standardProfileFields;
const accountFields = [
  ['bkash_number', 'বিকাশ নম্বর'], ['nagad_number', 'নগদ নম্বর'], ['rocket_number', 'রকেট নম্বর'], ['upay_number', 'উপায় নম্বর'],
  ['bank_name', 'ব্যাংকের নাম'], ['bank_account_number', 'ব্যাংক হিসাব নম্বর'], ['account_holder_name', 'হিসাবধারীর নাম'], ['branch_name', 'শাখার নাম']
];

export default function Profile() {
  const { user, setUser } = useOutletContext();
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [profileEditing, setProfileEditing] = useState(false);
  const [accountEditing, setAccountEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (user) setForm({ ...Object.fromEntries([...fieldsForRole(user.role), ...accountFields].map(([key]) => [key, user[key] || ''])), profile_picture: user.profile_picture || '' });
  }, [user]);
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><EmptyState icon={User} title="লগইন প্রয়োজন" description="প্রোফাইল দেখতে লগইন করুন।" /><Button asChild className="mt-4"><Link to="/login">লগইন করুন</Link></Button></div>;
  const profileFields = fieldsForRole(user.role);

  const save = async (section) => {
    setSaving(true);
    try {
      const fields = section === 'account' ? accountFields : profileFields;
      const payload = Object.fromEntries(fields.map(([key]) => [key, form[key] || null]));
      if (section === 'profile') payload.profile_picture = form.profile_picture;
      await apiClient.auth.updateMe(payload);
      const updated = await apiClient.auth.me(); setUser?.(updated);
      setProfileEditing(false); setAccountEditing(false);
      toast({ title: section === 'account' ? 'পেমেন্ট গ্রহণের তথ্য সংরক্ষণ করা হয়েছে' : 'প্রোফাইল সংরক্ষণ করা হয়েছে' });
    } catch (error) {
      toast({ title: 'কিছু ভুল হয়েছে, আবার চেষ্টা করুন', description: error.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    const result = await apiClient.upload(file, 'profiles');
    setForm((current) => ({ ...current, profile_picture: result.file_url }));
  };
  const storyPath = user.role === 'equipment_owner' ? '/equipment-owner-dashboard/share-story' : user.role === 'transport_provider' ? '/transport-dashboard/share-story' : '/farmer-dashboard/share-story';
  const canReceive = ['farmer', 'equipment_owner', 'transport_provider'].includes(user.role);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <BackButton />
      <div className="mt-3 overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="bg-gradient-to-r from-emerald-950 to-emerald-700 p-6 text-white">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              {form.profile_picture ? <img src={form.profile_picture} alt={user.full_name} loading="lazy" onError={(e) => { e.currentTarget.hidden = true; }} className="h-24 w-24 rounded-2xl border-4 border-white/20 object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15"><User className="h-10 w-10" /></div>}
              <div><h1 className="font-heading text-2xl font-bold">{user.full_name}</h1><p className="text-white/80">{user.email}</p><p className="text-sm text-white/65">{ROLE_LABELS[user.role] || user.role} · {user.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">{canReceive && <Button asChild variant="secondary"><Link to={storyPath}>আমার গল্প শেয়ার করুন</Link></Button>}<Button variant="secondary" onClick={() => setProfileEditing((value) => !value)}>{profileEditing ? <X className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}{profileEditing ? 'বাতিল' : 'প্রোফাইল সম্পাদনা'}</Button></div>
          </div>
        </div>
        <div className="p-6">
          {profileEditing ? <div className="space-y-5">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary"><Upload className="h-4 w-4" />প্রোফাইল ছবি পরিবর্তন<input type="file" accept="image/*" className="hidden" onChange={upload} /></label>
            <div className="grid gap-4 sm:grid-cols-2">{profileFields.map(([key, label]) => <label key={key} className="text-sm font-medium">{label}<Input className="mt-1" value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}</div>
            <Button onClick={() => save('profile')} disabled={saving}><Save className="mr-2 h-4 w-4" />সংরক্ষণ করুন</Button>
          </div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{profileFields.map(([key, label]) => <div key={key} className="rounded-2xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{user[key] || 'তথ্য দেওয়া হয়নি'}</p></div>)}</div>}
        </div>
      </div>

      {canReceive && <section className="mt-7 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-primary">ক্রেতার কাছে প্রদর্শিত হবে</p><h2 className="font-heading text-xl font-bold">পেমেন্ট গ্রহণের তথ্য</h2></div><Button variant="outline" onClick={() => setAccountEditing((value) => !value)}>{accountEditing ? <X className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}{accountEditing ? 'বাতিল' : 'সম্পাদনা'}</Button></div>
        {accountEditing ? <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">{accountFields.map(([key, label]) => <label key={key} className="text-sm font-medium">{label}<Input className="mt-1" value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}</div><Button onClick={() => save('account')} disabled={saving}><Save className="mr-2 h-4 w-4" />পেমেন্ট তথ্য সংরক্ষণ করুন</Button></div> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{accountFields.map(([key, label], index) => <div key={key} className="rounded-2xl border p-4"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{index < 4 ? <Smartphone className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}</div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-all font-semibold">{user[key] || 'যোগ করা হয়নি'}</p></div>)}</div>
        )}
      </section>}
    </div>
  );
}
