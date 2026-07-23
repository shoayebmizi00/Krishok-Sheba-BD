import React from 'react';
import { Users, Sprout, Package, MapPin } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePublicSummary } from '@/hooks/usePublicSummary';

export default function StatsSection() {
  const t = useTranslation();
  const { data = {}, isLoading, isError } = usePublicSummary();

  const stats = [
    { icon: Users, value: data.farmers, label: t('registeredFarmers') },
    { icon: Sprout, value: data.active_listings, label: t('activeListings') },
    { icon: Package, value: data.successful_trades, label: t('successfulTrades') },
    { icon: MapPin, value: data.districts, label: t('districtsCovered') },
  ];

  return (
    <section className="py-14 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary-foreground/15 flex items-center justify-center mb-3">
                <s.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="font-heading font-bold text-2xl md:text-3xl text-primary-foreground">
                {isLoading ? '…' : isError ? '—' : Number(s.value || 0).toLocaleString('bn-BD')}
              </div>
              <div className="text-sm text-primary-foreground/70 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
