import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import SimplePagination from '@/components/shared/SimplePagination';

const PAGE_SIZE = 9;

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    apiClient.entities.Story.filter({ status: 'approved' }, '-created_date', PAGE_SIZE, page)
      .then(setStories).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div><h1 className="font-heading text-3xl font-bold">সাফল্যের গল্প</h1><p className="text-muted-foreground">কৃষি ও ব্যবসায় এগিয়ে যাওয়ার বাস্তব গল্প</p></div>
        <Button asChild><Link to="/share-story"><Plus className="mr-2 h-4 w-4" /> আমার গল্প শেয়ার করুন</Link></Button>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Link key={story.id} to={`/stories/${story.id}`} className="overflow-hidden rounded-2xl border bg-card hover:shadow-lg">
              {story.image ? <img src={story.image} alt="" loading="lazy" className="h-44 w-full object-cover" /> : <div className="flex h-44 items-center justify-center bg-primary/10"><BookOpen className="h-12 w-12 text-primary" /></div>}
              <div className="p-5"><h2 className="font-semibold">{story.title}</h2><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{story.content}</p><p className="mt-4 text-xs">{story.author_name} · {story.district}</p></div>
            </Link>
          ))}
        </div>
      )}
      <SimplePagination page={page} hasNext={stories.length === PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
