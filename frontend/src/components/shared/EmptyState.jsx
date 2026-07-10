import React from 'react';
import { Inbox } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  const t = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-heading font-semibold text-foreground">{title || t('common.noData')}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
