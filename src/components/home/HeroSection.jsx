import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Sprout, TrendingUp, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/useTranslation';

export default function HeroSection() {
  const t = useTranslation();

  const featureCards = [
    { icon: Sprout, title: 'ফসল বিক্রি করুন', desc: 'নতুন ফসলের তালিকা প্রকাশ করুন', color: "bg-green-50 text-green-600", to: '/farmer-dashboard/add-listing' },
    { icon: TrendingUp, title: 'বাজার দর দেখুন', desc: 'জেলা ও বাজারভিত্তিক মূল্য জানুন', color: "bg-yellow-50 text-yellow-600", to: '/market-prices' },
    { icon: Search, title: 'যন্ত্রপাতি ভাড়া করুন', desc: 'সহজে কৃষি যন্ত্র খুঁজুন', color: "bg-orange-50 text-orange-600", to: '/equipment' },
    { icon: Truck, title: 'পরিবহন বুক করুন', desc: 'ফসল পরিবহনের গাড়ি বুক করুন', color: "bg-blue-50 text-blue-600", to: '/transport' },
  ];

  const stats = [
    { num: "10,000+", label: t('farmers') },
    { num: "5,000+", label: t('buyers') },
    { num: "64", label: t('districts') },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary to-background">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 20 L30 15 L25 20 Z' fill='%2316A34A' /%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sprout className="w-4 h-4" />
              {t('platformTagline')}
            </div>

            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight">
              {t('heroTitle')}
              <span className="text-primary block mt-1">{t('heroSubtitle')}</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              {t('heroDesc')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/marketplace">
                <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto">
                  {t('exploreMarketplace')} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary/5">
                  {t('joinAsFarmer')}
                </Button>
              </Link>
            </div>

            <div className="flex gap-6 pt-4">
              {stats.map((s) =>
              <div key={s.label}>
                  <div className="font-heading font-bold text-xl text-foreground">{s.num}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 auto-rows-fr gap-4">
            {featureCards.map((f) =>
            <Link to={f.to} key={f.title} className="h-full min-h-44 p-6 bg-card border border-border shadow-sm hover:-translate-y-1 hover:shadow-md transition-all rounded-2xl flex flex-col cursor-pointer">
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-3`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>);
}
