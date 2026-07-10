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
  { image: heroMain, altKey: 'home.hero.slides.mainAlt' },
  { image: heroEquipment, altKey: 'home.hero.slides.equipmentAlt' },
  { image: heroFields, altKey: 'home.hero.slides.fieldsAlt' },
  { image: heroTea, altKey: 'home.hero.slides.teaAlt' },
  { image: heroRiceTouch, altKey: 'home.hero.slides.riceTouchAlt' },
  { image: heroRice, altKey: 'home.hero.slides.riceAlt' },
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
    {
      icon: Sprout,
      titleKey: 'home.hero.cards.marketplace.title',
      descriptionKey: 'home.hero.cards.marketplace.description',
      iconClass: 'bg-green-100 text-green-700 dark:bg-green-950/70 dark:text-green-300',
      to: '/marketplace',
    },
    {
      icon: TrendingUp,
      titleKey: 'home.hero.cards.price.title',
      descriptionKey: 'home.hero.cards.price.description',
      iconClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
      to: '/market-prices',
    },
    {
      icon: Search,
      titleKey: 'home.hero.cards.equipment.title',
      descriptionKey: 'home.hero.cards.equipment.description',
      iconClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300',
      to: '/equipment',
    },
    {
      icon: Truck,
      titleKey: 'home.hero.cards.transport.title',
      descriptionKey: 'home.hero.cards.transport.description',
      iconClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
      to: '/transport',
    },
  ];

  const stats = [
    { num: "10,000+", label: t('farmers') },
    { num: "5,000+", label: t('buyers') },
    { num: "64", label: t('districts') },
  ];

  return (
    <section className="relative min-h-[720px] overflow-hidden bg-white dark:bg-gray-950 lg:min-h-[680px]">
      <div className="absolute inset-0">
        <img
          key={heroSlides[activeSlide].image}
          src={heroSlides[activeSlide].image}
          alt={t(heroSlides[activeSlide].altKey)}
          fetchPriority={activeSlide === 0 ? 'high' : 'auto'}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-white/35 dark:from-gray-950/90 dark:via-gray-950/75 dark:to-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/20 dark:from-black/70 dark:via-transparent dark:to-black/30" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-600/30 bg-white/80 px-3 py-1.5 text-sm font-medium text-green-800 shadow-sm backdrop-blur-sm dark:border-green-400/30 dark:bg-gray-950/70 dark:text-green-200">
              <Sprout className="w-4 h-4" />
              {t('home.hero.tagline')}
            </div>

            <h1 className="font-heading text-4xl font-extrabold leading-tight text-gray-950 drop-shadow-sm dark:text-white dark:drop-shadow-lg sm:text-5xl lg:text-6xl">
              {t('home.hero.title')}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-gray-700 drop-shadow-sm dark:text-gray-300 dark:drop-shadow">
              {t('home.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/farmer-dashboard/add-listing">
                <Button size="lg" className="w-full gap-2 bg-green-600 text-white hover:bg-green-700 sm:w-auto">
                  {t('home.hero.primaryButton')} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/market-prices">
                <Button size="lg" variant="outline" className="w-full border border-green-600 bg-white text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-500 dark:bg-gray-900 dark:text-green-300 dark:hover:bg-gray-800 dark:hover:text-green-200 sm:w-auto">
                  {t('home.hero.secondaryButton')}
                </Button>
              </Link>
            </div>

            <div className="flex gap-6 pt-4">
              {stats.map((s) =>
              <div key={s.label}>
                  <div className="font-heading text-xl font-bold text-gray-950 dark:text-white">{s.num}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{s.label}</div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
            {featureCards.map((f) =>
            <Link to={f.to} key={f.titleKey} className="flex min-h-32 h-full cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white/90 p-4 text-gray-950 shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl dark:border-gray-700 dark:bg-gray-900/90 dark:text-white dark:hover:bg-gray-900">
                <div className={`w-10 h-10 rounded-xl ${f.iconClass} flex items-center justify-center mb-3`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-sm text-gray-950 dark:text-white">{t(f.titleKey)}</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed dark:text-gray-300">{t(f.descriptionKey)}</p>
              </Link>
            )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between lg:mt-12">
          <div className="flex gap-2" aria-label={t('home.hero.carouselLabel')}>
            {heroSlides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => setActiveSlide(index)}
                aria-label={`${t('home.hero.showSlide')} ${index + 1}`}
                aria-current={index === activeSlide}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeSlide ? 'w-8 bg-green-700 dark:bg-white' : 'w-2.5 bg-green-700/40 hover:bg-green-700/70 dark:bg-white/45 dark:hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={showPreviousSlide}
              aria-label={t('home.hero.previousImage')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-green-700/30 bg-white/80 text-green-800 backdrop-blur-sm transition hover:bg-green-700 hover:text-white dark:border-white/30 dark:bg-black/30 dark:text-white dark:hover:bg-white dark:hover:text-emerald-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={showNextSlide}
              aria-label={t('home.hero.nextImage')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-green-700/30 bg-white/80 text-green-800 backdrop-blur-sm transition hover:bg-green-700 hover:text-white dark:border-white/30 dark:bg-black/30 dark:text-white dark:hover:bg-white dark:hover:text-emerald-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>);
}
