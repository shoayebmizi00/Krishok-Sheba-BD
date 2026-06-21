import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Phone, Mail, MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function Footer() {
  const t = useTranslation();

  const quickLinks = [
    { label: t('marketplace'), path: "/marketplace" },
    { label: t('equipmentRentalLink'), path: "/equipment" },
    { label: t('transport'), path: "/transport" },
    { label: t('marketPrices'), path: "/market-prices" },
  ];

  const services = [t('preHarvestTrading'), t('cropBuySell'), t('equipmentRental'), t('govNotices')];

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Sprout className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg">কৃষক-সেবা বিডি</span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              {t('footerDesc')}
            </p>
          </div>

          <div>
            <h3 className="font-heading font-semibold mb-4">{t('quickLinks')}</h3>
            <div className="space-y-2.5">
              {quickLinks.map(l => (
                <Link key={l.path} to={l.path} className="block text-sm text-background/60 hover:text-primary transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold mb-4">{t('services')}</h3>
            <div className="space-y-2.5">
              {services.map(s => (
                <p key={s} className="text-sm text-background/60">{s}</p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold mb-4">{t('contact')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-background/60">
                <Phone className="w-4 h-4 shrink-0" /> +880 1XXX-XXXXXX
              </div>
              <div className="flex items-center gap-2 text-sm text-background/60">
                <Mail className="w-4 h-4 shrink-0" /> info@krishoksheba.bd
              </div>
              <div className="flex items-center gap-2 text-sm text-background/60">
                <MapPin className="w-4 h-4 shrink-0" /> ঢাকা, বাংলাদেশ
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-10 pt-6 text-center">
          <p className="text-sm text-background/40">
            © {new Date().getFullYear()} কৃষক-সেবা বিডি। {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}
