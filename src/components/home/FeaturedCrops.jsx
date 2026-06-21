import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, MapPin } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/constants';

const DEFAULT_CROP_IMAGE = 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=900&q=75';

export default function FeaturedCrops() {
  const { data: crops = [], isLoading } = useQuery({
    queryKey: ['home', 'crops'],
    queryFn: () => apiClient.entities.CropListing.filter({ status: 'active' }, '-created_date', 4)
  });

  return (
    <section className="bg-background py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-bold">সর্বশেষ ফসল</h2>
            <p className="mt-1 text-muted-foreground">কৃষকদের নতুন ও সক্রিয় ফসলের তালিকা</p>
          </div>
          <Button asChild variant="outline" className="hidden gap-2 sm:flex">
            <Link to="/marketplace">আরো দেখুন <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading && [1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-72 rounded-2xl" />)}
          {!isLoading && crops.map((crop) => (
            <Link
              key={crop.id}
              to={`/listing/${crop.id}`}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <img
                src={crop.images?.[0] || DEFAULT_CROP_IMAGE}
                onError={(event) => { event.currentTarget.src = DEFAULT_CROP_IMAGE; }}
                alt={crop.crop_name}
                loading="lazy"
                decoding="async"
                className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="p-4">
                <h3 className="font-heading font-semibold group-hover:text-primary">{crop.crop_name}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {crop.district}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold text-primary">{formatCurrency(crop.expected_price)}/{crop.unit}</span>
                  <span className="text-xs text-muted-foreground">{crop.quantity} {crop.unit}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {!isLoading && crops.length === 0 && (
          <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">এখনো কোনো সক্রিয় ফসল নেই।</p>
        )}
      </div>
    </section>
  );
}
