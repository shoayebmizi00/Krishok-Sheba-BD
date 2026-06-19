import React from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function SuccessStories() {
  const t = useTranslation();

  const STORIES = [
    { quote: t('story1Quote'), name: t('story1Name'), role: t('story1Role'), location: t('story1Location') },
    { quote: t('story2Quote'), name: t('story2Name'), role: t('story2Role'), location: t('story2Location') },
    { quote: t('story3Quote'), name: t('story3Name'), role: t('story3Role'), location: t('story3Location') },
  ];

  return (
    <section className="py-16 md:py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl text-foreground">{t('successStories')}</h2>
          <p className="text-muted-foreground mt-3">{t('successStoriesDesc')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {STORIES.map((s, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex gap-0.5 mb-4">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">"{s.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{s.name[0]}</span>
                </div>
                <div>
                  <div className="font-medium text-sm text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.role}, {s.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}