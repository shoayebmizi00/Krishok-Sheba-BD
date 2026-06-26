import React from 'react';
import { User } from 'lucide-react';
import { ROLE_LABELS } from '@/utils/constants';

const formatConversationTime = (value) => value
  ? new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
  : '';

export default function ConversationCard({ conversation, user, active, onSelect }) {
  const unread = Number(conversation.unread_count || 0);
  const name = conversation.other_name
    || conversation.participant_names?.find((item) => item !== user.full_name)
    || 'ব্যবহারকারী';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full gap-3 border-b border-border p-4 text-left transition-colors ${active ? 'bg-primary/10' : 'hover:bg-muted/60'}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <User className="h-5 w-5 text-primary" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-semibold">{name}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">{formatConversationTime(conversation.last_message_at || conversation.last_message_date)}</span>
        </span>
        <span className="mt-0.5 block text-xs text-primary">{ROLE_LABELS[conversation.other_role] || conversation.other_role || ''}</span>
        <span className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">{conversation.last_message || 'এখনও কোনো বার্তা নেই'}</span>
          {unread > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{unread}</span>}
        </span>
      </span>
    </button>
  );
}
