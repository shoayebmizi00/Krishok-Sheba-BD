import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorks from '@/components/home/HowItWorks';
import StatsSection from '@/components/home/StatsSection';
import FeaturedCrops from '@/components/home/FeaturedCrops';
import SuccessStories from '@/components/home/SuccessStories';
import ServicePreviewSection from '@/components/home/ServicePreviewSection';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <FeaturedCrops />
      <ServicePreviewSection type="equipment" />
      <ServicePreviewSection type="transport" />
      <StatsSection />
      <SuccessStories />
    </div>
  );
}
