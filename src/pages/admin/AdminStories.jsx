import React, { useEffect, useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => apiClient.entities.Story.list('-created_date').then(setStories).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const update = async (id, status) => { await apiClient.entities.Story.update(id, { status }); load(); };
  if (loading) return <LoadingSpinner />;
  return <div className="space-y-5"><h2 className="font-heading text-xl font-bold">গল্প অনুমোদন</h2>{stories.map((story) => <div key={story.id} className="rounded-xl border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{story.title}</h3><p className="text-sm text-muted-foreground">{story.author_name} · {story.district}</p></div><StatusBadge status={story.status} /></div><p className="mt-3 line-clamp-3 text-sm">{story.content}</p><div className="mt-4 flex gap-2"><Button size="sm" onClick={() => update(story.id, 'approved')}>অনুমোদন</Button><Button size="sm" variant="destructive" onClick={() => update(story.id, 'rejected')}>প্রত্যাখ্যান</Button></div></div>)}</div>;
}
