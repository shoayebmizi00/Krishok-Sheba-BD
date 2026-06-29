import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import BackButton from '@/components/shared/BackButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function StoryDetail() {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiClient.entities.Story.filter({ id }, undefined, 1).then((rows) => setStory(rows[0])).finally(() => setLoading(false)); }, [id]);
  if (loading) return <LoadingSpinner />;
  if (!story) return <div className="mx-auto max-w-3xl px-4 py-12"><BackButton fallback="/stories" /><p>গল্পটি পাওয়া যায়নি।</p></div>;
  return <article className="mx-auto max-w-3xl px-4 py-10"><BackButton fallback="/stories" />{story.image && <img src={story.image} alt="" className="mt-4 max-h-96 w-full rounded-2xl object-cover" />}<h1 className="mt-6 font-heading text-3xl font-bold">{story.title}</h1><p className="mt-2 text-sm text-muted-foreground">{story.author_name} · {story.district} · {story.category}</p><div className="mt-6 whitespace-pre-wrap leading-8">{story.content}</div></article>;
}
