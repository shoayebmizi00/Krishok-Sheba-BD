import React, { useState } from 'react';
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import BackButton from '@/components/shared/BackButton';

export default function ShareStory() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: '', content: '', image: '', category: '', district: user?.district || '' });
  const [saving, setSaving] = useState(false);
  if (!user) return <Navigate to="/login" replace />;
  const submit = async (event) => {
    event.preventDefault();
    if (!form.title || !form.content || !form.district) return;
    setSaving(true);
    try {
      await apiClient.entities.Story.create(form);
      toast({ title: 'গল্প জমা হয়েছে', description: 'প্রশাসকের অনুমোদনের পর গল্পটি প্রকাশিত হবে।' });
      navigate('/stories');
    } finally { setSaving(false); }
  };
  return <div className="mx-auto max-w-2xl px-4 py-10"><BackButton fallback="/stories" /><h1 className="mb-6 font-heading text-2xl font-bold">আমার গল্প শেয়ার করুন</h1><form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6"><Input placeholder="গল্পের শিরোনাম" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Textarea rows={10} placeholder="আপনার অভিজ্ঞতা বিস্তারিত লিখুন" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /><Input placeholder="ফসল বা ব্যবসার বিভাগ" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /><Input placeholder="জেলা" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /><Input placeholder="ছবির URL (ঐচ্ছিক)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /><Button disabled={saving}>{saving ? 'জমা হচ্ছে...' : 'অনুমোদনের জন্য জমা দিন'}</Button></form></div>;
}
