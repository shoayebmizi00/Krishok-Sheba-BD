import React from 'react';
import { UserPlus, ListPlus, Handshake, Banknote } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function HowItWorks() {
  const t = useTranslation();

  const steps = [
    { icon: UserPlus, step: "01", title: t('step1Title'), desc: t('step1Desc') },
    { icon: ListPlus, step: "02", title: t('step2Title'), desc: t('step2Desc') },
    { icon: Handshake, step: "03", title: t('step3Title'), desc: t('step3Desc') },
    { icon: Banknote, step: "04", title: t('step4Title'), desc: t('step4Desc') },
  ];

  return (
    <section className="py-16 md:py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl text-foreground">{t('howItWorks')}</h2>
          <p className="text-muted-foreground mt-3">{t('howItWorksDesc')}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <s.icon className="w-7 h-7 text-primary-foreground" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}