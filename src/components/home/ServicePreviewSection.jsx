import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, MapPin, Truck, Wrench } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/constants';
import StatusBadge from '@/components/shared/StatusBadge';
import defaultTransportImage from '@/assets/hero/hero-equipment.jpg';

const FALLBACK = defaultTransportImage;

export default function ServicePreviewSection({ type }) {
  const equipment = type === 'equipment';
  const entity = equipment ? apiClient.entities.Equipment : apiClient.entities.Vehicle;
  const route = equipment ? '/equipment' : '/transport';
  const title = equipment ? 'যন্ত্রপাতি ভাড়া' : 'পরিবহন বুকিং';
  const subtitle = equipment ? 'সর্বশেষ উপলভ্য কৃষি যন্ত্রপাতি' : 'ফসল পরিবহনের জন্য উপলভ্য যানবাহন';
  const Icon = equipment ? Wrench : Truck;
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['home', type],
    queryFn: () => entity.list('-created_date', 4)
  });

  return (
    <section className="bg-secondary/20 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Button asChild variant="outline"><Link to={route}>সব দেখুন <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading && [1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-64 rounded-2xl" />)}
          {!isLoading && items.map((item) => (
            <Link key={item.id} to={`${route}?item=${item.id}`} className="group overflow-hidden rounded-2xl border bg-card hover:shadow-lg">
              {item.images?.[0] ? (
                <img
                  src={item.images[0]}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK;
                  }}
                  alt={equipment ? item.name : `${(item.vehicle_type || 'পরিবহন').replaceAll('_', ' ')} যানবাহন`}
                  loading="lazy"
                  decoding="async"
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="relative h-36 overflow-hidden bg-primary/5">
                  <img src={FALLBACK} alt="" className="h-full w-full object-cover opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10"><Icon className="h-12 w-12 text-white drop-shadow" /></div>
                </div>
              )}
              <div className="space-y-2 p-4">
                <div className="flex justify-between gap-2">
                  <h3 className="font-semibold group-hover:text-primary">{equipment ? item.name : (item.vehicle_type || '').replaceAll('_', ' ')}</h3>
                  <StatusBadge status={item.availability || 'available'} />
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {item.district}</p>
                <p className="text-sm text-muted-foreground">{equipment ? item.type?.replaceAll('_', ' ') : `ধারণক্ষমতা: ${item.capacity || 'উল্লেখ নেই'}`}</p>
                <p className="font-bold text-primary">{formatCurrency(equipment ? item.rent_price_per_day : item.price_per_km)} / {equipment ? 'দিন' : 'কিমি'}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
