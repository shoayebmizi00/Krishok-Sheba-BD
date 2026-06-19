import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorks from '@/components/home/HowItWorks';
import StatsSection from '@/components/home/StatsSection';
import FeaturedCrops from '@/components/home/FeaturedCrops';
import SuccessStories from '@/components/home/SuccessStories';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <FeaturedCrops />
      <StatsSection />
      <SuccessStories />
    </div>
  );
}