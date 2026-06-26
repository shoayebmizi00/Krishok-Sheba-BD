import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatDate } from '@/utils/constants';

export default function AdminNotices() {
  const { toast } = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'notice', description: '', eligibility: '', deadline: '', link: '' });

  const load = async () => {
    const data = await apiClient.entities.GovernmentNotice.list('-created_date');
    setNotices(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.description) return;
    await apiClient.entities.GovernmentNotice.create({ ...form, is_active: true });
    toast({ title: "নোটিশ সফলভাবে তৈরি হয়েছে" });
    setForm({ title: '', category: 'notice', description: '', eligibility: '', deadline: '', link: '' });
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    await apiClient.entities.GovernmentNotice.delete(id);
    toast({ title: "নোটিশ মুছে ফেলা হয়েছে" });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl text-foreground">নোটিশ ব্যবস্থাপনা</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 gap-2"><Plus className="w-4 h-4" /> নোটিশ যোগ করুন</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>সরকারি নোটিশ যোগ করুন</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="নোটিশের শিরোনাম" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
              <Select value={form.category} onValueChange={v => setForm(p => ({...p, category: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="notice">নোটিশ</SelectItem>
                  <SelectItem value="subsidy">ভর্তুকি</SelectItem>
                  <SelectItem value="loan">ঋণ</SelectItem>
                  <SelectItem value="training">প্রশিক্ষণ</SelectItem>
                  <SelectItem value="scheme">প্রকল্প</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={3} />
              <Input placeholder="Eligibility" value={form.eligibility} onChange={e => setForm(p => ({...p, eligibility: e.target.value}))} />
              <Input type="date" placeholder="Deadline" value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} />
              <Input placeholder="External Link (optional)" value={form.link} onChange={e => setForm(p => ({...p, link: e.target.value}))} />
              <Button onClick={handleCreate} disabled={!form.title || !form.description} className="w-full bg-primary hover:bg-primary/90">
                Create Notice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notices.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices" description="Add government notices for farmers" />
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">{n.title}</h3>
                <p className="text-xs text-muted-foreground capitalize">{n.category} · {formatDate(n.created_date)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)} className="text-destructive shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
