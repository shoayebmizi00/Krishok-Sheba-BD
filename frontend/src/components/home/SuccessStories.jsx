import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuccessStories() {
  const { data: stories = [], isLoading, isError } = useQuery({
    queryKey: ['home', 'stories'],
    queryFn: () => apiClient.entities.Story.filter({ status: 'approved' }, '-created_date', 3)
  });

  return (
    <section className="bg-secondary/30 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-bold">সাফল্যের গল্প</h2>
            <p className="mt-2 text-muted-foreground">নিবন্ধিত কৃষক ও বিক্রেতাদের বাস্তব অভিজ্ঞতা</p>
          </div>
          <Button asChild variant="outline"><Link to="/stories">সব গল্প <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {isLoading && [1, 2, 3].map((item) => <Skeleton key={item} className="h-64 rounded-2xl" />)}
          {!isLoading && !isError && stories.map((story) => (
            <Link key={story.id} to={`/stories/${story.id}`} className="group overflow-hidden rounded-2xl border bg-card hover:shadow-lg">
              {story.image ? <img src={story.image} alt="" loading="lazy" className="h-36 w-full object-cover" /> : (
                <div className="flex h-36 items-center justify-center bg-primary/10"><BookOpen className="h-12 w-12 text-primary/50" /></div>
              )}
              <div className="p-5">
                <h3 className="font-heading font-semibold group-hover:text-primary">{story.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{story.content}</p>
                <p className="mt-4 text-xs text-muted-foreground">{story.author_name} · {story.district}</p>
              </div>
            </Link>
          ))}
        </div>
        {isError && <p className="text-center text-destructive">গল্পের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।</p>}
        {!isLoading && !isError && stories.length === 0 && <p className="text-center text-muted-foreground">অনুমোদিত গল্প এখনো প্রকাশিত হয়নি।</p>}
      </div>
    </section>
  );
}
