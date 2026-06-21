import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const GROUPS = [
  ['crop_category', 'ফসলের বিভাগ'], ['equipment_category', 'যন্ত্রপাতির বিভাগ'],
  ['vehicle_category', 'যানবাহনের বিভাগ'], ['unit', 'একক'], ['district', 'জেলা'],
  ['payment_method', 'পেমেন্ট পদ্ধতি'], ['notice_type', 'নোটিশের ধরন'], ['blog_category', 'ব্লগ বিভাগ']
];

export default function AdminSettings() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ setting_group: 'crop_category', value: '', label_bn: '', label_en: '', is_active: true });
  const load = () => apiClient.entities.AppSetting.list('sort_order').then(setItems);
  useEffect(() => { load(); }, []);
  const add = async () => { if (!form.value || !form.label_bn) return; await apiClient.entities.AppSetting.create(form); setForm({ ...form, value: '', label_bn: '', label_en: '' }); load(); };
  const remove = async (id) => { await apiClient.entities.AppSetting.delete(id); load(); };
  return <div className="space-y-6"><h2 className="font-heading text-xl font-bold">সেটিংস ও কনফিগারেশন</h2><div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-4"><Select value={form.setting_group} onValueChange={(value) => setForm({ ...form, setting_group: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GROUPS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Input placeholder="মান (যেমন: rice)" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /><Input placeholder="বাংলা নাম" value={form.label_bn} onChange={(e) => setForm({ ...form, label_bn: e.target.value })} /><Button onClick={add}><Plus className="mr-2 h-4 w-4" /> যোগ করুন</Button></div><div className="space-y-2">{items.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border bg-card p-3"><div><span className="font-medium">{item.label_bn}</span><span className="ml-2 text-xs text-muted-foreground">{item.setting_group} · {item.value}</span></div><Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></Button></div>)}</div></div>;
}
