import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Edit3, Save, Upload, User, X } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import BackButton from '@/components/shared/BackButton';
import { ROLE_LABELS } from '@/lib/constants';

const fields = [
  ['phone', 'ফোন নম্বর'], ['district', 'জেলা'], ['farm_name', 'খামারের নাম'],
  ['land_size', 'জমির পরিমাণ (একর)'], ['crops_grown', 'চাষ করা ফসল'],
  ['bkash_number', 'বিকাশ নম্বর'], ['nagad_number', 'নগদ নম্বর'],
  ['rocket_number', 'রকেট নম্বর'], ['upay_number', 'উপায় নম্বর'],
  ['bank_name', 'ব্যাংকের নাম'], ['bank_account_number', 'ব্যাংক হিসাব নম্বর'],
  ['account_holder_name', 'হিসাবধারীর নাম'], ['branch_name', 'শাখার নাম']
];

export default function Profile() {
  const { user, setUser } = useOutletContext();
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const storyPath = user?.role === 'equipment_owner'
    ? '/equipment-owner-dashboard/share-story'
    : user?.role === 'transport_provider'
      ? '/transport-dashboard/share-story'
      : '/farmer-dashboard/share-story';
  useEffect(() => {
    if (user) setForm({ ...Object.fromEntries(fields.map(([key]) => [key, user[key] || ''])), profile_picture: user.profile_picture || '' });
  }, [user]);

  if (!user) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><EmptyState icon={User} title="লগইন প্রয়োজন" description="প্রোফাইল দেখতে লগইন করুন।" /><Button asChild className="mt-4"><Link to="/login">লগইন করুন</Link></Button></div>;

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const { file_url } = await apiClient.upload(file, 'profiles');
    setForm((current) => ({ ...current, profile_picture: file_url }));
  };
  const save = async () => {
    setSaving(true);
    try {
      await apiClient.auth.updateMe(form);
      const updated = await apiClient.auth.me();
      setUser?.(updated);
      setEditing(false);
      toast({ title: 'প্রোফাইল সংরক্ষণ হয়েছে' });
    } catch (error) {
      toast({ title: 'প্রোফাইল সংরক্ষণ হয়নি', description: error.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  if (!form) return <LoadingSpinner />;
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <BackButton />
      <div className="mt-3 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="bg-gradient-to-r from-primary to-emerald-700 p-6 text-primary-foreground">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              {form.profile_picture ? <img src={form.profile_picture} alt="" className="h-24 w-24 rounded-2xl border-4 border-white/30 object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15"><User className="h-10 w-10" /></div>}
              <div><h1 className="font-heading text-2xl font-bold">{user.full_name}</h1><p>{user.email}</p><p className="text-sm opacity-80">{ROLE_LABELS[user.role] || user.role}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['farmer', 'equipment_owner', 'transport_provider'].includes(user.role) && <Button asChild variant="secondary"><Link to={storyPath}>আমার গল্প শেয়ার করুন</Link></Button>}
              <Button variant="secondary" onClick={() => setEditing((value) => !value)}>{editing ? <X className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}{editing ? 'বাতিল' : 'প্রোফাইল সম্পাদনা'}</Button>
            </div>
          </div>
        </div>
        {editing ? (
          <div className="space-y-5 p-6">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary"><Upload className="h-4 w-4" /> প্রোফাইল ছবি পরিবর্তন<input type="file" accept="image/*" onChange={upload} className="hidden" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(([key, label]) => <label key={key} className="space-y-1 text-sm font-medium">{label}<Input value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
            </div>
            <Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</Button>
          </div>
        ) : (
          <div className="grid gap-px bg-border sm:grid-cols-2">
            {fields.map(([key, label]) => <div key={key} className="bg-card p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{user[key] || 'তথ্য দেওয়া হয়নি'}</p></div>)}
          </div>
        )}
      </div>
    </div>
  );
}
