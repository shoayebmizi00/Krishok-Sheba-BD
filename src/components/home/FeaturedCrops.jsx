import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/constants';
import { useTranslation } from '@/lib/useTranslation';

const PLACEHOLDER_CROPS = [
  { id: 1, crop_name: "Aman Rice", quantity: 500, unit: "kg", expected_price: 28, district: "Rangpur", status: "active" },
  { id: 2, crop_name: "Potato", quantity: 1000, unit: "kg", expected_price: 22, district: "Bogura", status: "active" },
  { id: 3, crop_name: "Onion", quantity: 300, unit: "kg", expected_price: 45, district: "Rajshahi", status: "active" },
  { id: 4, crop_name: "Tomato", quantity: 200, unit: "kg", expected_price: 35, district: "Jessore", status: "active" },
];

export default function FeaturedCrops() {
  const [crops, setCrops] = useState([]);
  const t = useTranslation();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.entities.CropListing.filter({ status: 'active' }, '-created_date', 4);
        setCrops(data.length > 0 ? data : PLACEHOLDER_CROPS);
      } catch {
        setCrops(PLACEHOLDER_CROPS);
      }
    };
    load();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading font-bold text-3xl text-foreground">{t('featuredCrops')}</h2>
            <p className="text-muted-foreground mt-1">{t('featuredCropsDesc')}</p>
          </div>
          <Link to="/marketplace" className="hidden sm:block">
            <Button variant="outline" className="gap-2">{t('viewAll')} <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {crops.map(crop => (
            <div key={crop.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="h-36 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <span className="text-4xl">🌾</span>
              </div>
              <div className="p-4">
                <h3 className="font-heading font-semibold text-foreground">{crop.crop_name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" /> {crop.district}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-lg font-bold text-primary">{formatCurrency(crop.expected_price)}</span>
                    <span className="text-xs text-muted-foreground">/{crop.unit}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{crop.quantity} {crop.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Link to="/marketplace">
            <Button variant="outline" className="gap-2">{t('viewAllCrops')} <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
