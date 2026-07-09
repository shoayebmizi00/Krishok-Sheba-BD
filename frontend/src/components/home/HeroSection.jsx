import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, ChevronLeft, ChevronRight, Sprout, TrendingUp, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import heroMain from '@/assets/hero/hero-main.jpg';
import heroEquipment from '@/assets/hero/hero-equipment.jpg';
import heroTea from '@/assets/hero/hero-tea.jpg';
import heroFields from '@/assets/hero/hero-fields.jpg';
import heroRiceTouch from '@/assets/hero/hero-rice-touch.jpg';
import heroRice from '@/assets/hero/hero-rice.jpg';

const heroSlides = [
  { image: heroMain, alt: 'Farmer working in an agricultural field' },
  { image: heroEquipment, alt: 'Modern farming equipment in a crop field' },
  { image: heroFields, alt: 'Farmers working in green vegetable fields' },
  { image: heroTea, alt: 'Workers harvesting crops in a green field' },
  { image: heroRiceTouch, alt: 'A hand touching ripe rice plants' },
  { image: heroRice, alt: 'Golden rice ready for harvest' },
];

export default function HeroSection() {
  const t = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const carouselTimer = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(carouselTimer);
  }, []);

  const showPreviousSlide = () => {
    setActiveSlide((currentSlide) => (currentSlide - 1 + heroSlides.length) % heroSlides.length);
  };

  const showNextSlide = () => {
    setActiveSlide((currentSlide) => (currentSlide + 1) % heroSlides.length);
  };

  const featureCards = [
    { icon: Sprout, title: 'ফসল মার্কেটপ্লেস', desc: 'কৃষকের কাছ থেকে সরাসরি ফসল কিনুন ও বিক্রি করুন', color: "bg-green-50 text-green-600", to: '/marketplace' },
    { icon: TrendingUp, title: 'বাজার দর', desc: 'জেলা ও বাজারভিত্তিক হালনাগাদ মূল্য জানুন', color: "bg-yellow-50 text-yellow-600", to: '/market-prices' },
    { icon: Search, title: 'যন্ত্রপাতি ভাড়া', desc: 'প্রয়োজনীয় কৃষি যন্ত্র সহজে ভাড়া নিন', color: "bg-orange-50 text-orange-600", to: '/equipment' },
    { icon: Truck, title: 'পরিবহন বুকিং', desc: 'ফসল পরিবহনের জন্য যানবাহন বুক করুন', color: "bg-blue-50 text-blue-600", to: '/transport' },
  ];

  const stats = [
    { num: "10,000+", label: t('farmers') },
    { num: "5,000+", label: t('buyers') },
    { num: "64", label: t('districts') },
  ];

  return (
    <section className="relative min-h-[720px] overflow-hidden bg-emerald-950 lg:min-h-[680px]">
      <div className="absolute inset-0">
        <img
          key={heroSlides[activeSlide].image}
          src={heroSlides[activeSlide].image}
          alt={heroSlides[activeSlide].alt}
          fetchPriority={activeSlide === 0 ? 'high' : 'auto'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-emerald-950/65 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <Sprout className="w-4 h-4" />
              {t('platformTagline')}
            </div>

            <h1 className="font-heading text-4xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
              Smart Digital Marketplace for Farmers
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/85 drop-shadow">
              Connecting farmers, buyers, equipment owners, and transport providers for fair prices, easy booking, and secure transactions.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/farmer-dashboard/add-listing">
                <Button size="lg" className="w-full gap-2 bg-primary hover:bg-primary/90 sm:w-auto">
                  {t('exploreMarketplace')} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/market-prices">
                <Button size="lg" variant="outline" className="w-full border-white/50 bg-white/10 text-white hover:bg-white hover:text-primary sm:w-auto">
                  {t('joinAsFarmer')}
                </Button>
              </Link>
            </div>

            <div className="flex gap-6 pt-4">
              {stats.map((s) =>
              <div key={s.label}>
                  <div className="font-heading text-xl font-bold text-white">{s.num}</div>
                  <div className="text-xs text-white/70">{s.label}</div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
            {featureCards.map((f) =>
            <Link to={f.to} key={f.title} className="flex min-h-32 h-full cursor-pointer flex-col rounded-2xl border border-white/25 bg-white/95 p-4 shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl">
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

        <div className="mt-10 flex items-center justify-between lg:mt-12">
          <div className="flex gap-2" aria-label="Hero carousel slides">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => setActiveSlide(index)}
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === activeSlide}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={showPreviousSlide}
              aria-label="Previous image"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm transition hover:bg-white hover:text-emerald-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={showNextSlide}
              aria-label="Next image"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm transition hover:bg-white hover:text-emerald-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>);
}
