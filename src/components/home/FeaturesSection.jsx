import React from 'react';
import { Sprout, BarChart3, Truck, Wrench, ShieldCheck, Bell } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function FeaturesSection() {
  const t = useTranslation();

  const features = [
    { icon: Sprout, title: t('cropMarketplace'), desc: t('cropMarketplaceDesc') },
    { icon: BarChart3, title: t('priceComparison'), desc: t('priceComparisonDesc') },
    { icon: Wrench, title: t('equipmentRental'), desc: t('equipmentRentalDesc') },
    { icon: Truck, title: t('transportBooking'), desc: t('transportBookingDesc') },
    { icon: ShieldCheck, title: t('govSupport'), desc: t('govSupportDesc') },
    { icon: Bell, title: t('notificationsFeature'), desc: t('notificationsFeatureDesc') },
  ];

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl text-foreground">{t('platformFeatures')}</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            {t('featuresDesc')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}