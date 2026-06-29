import React from 'react';
import { MessageSquare } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ConversationCard from './ConversationCard';

export default function ConversationList({ conversations, loading, selectedId, user, onSelect }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <div className="p-8"><LoadingSpinner /></div>
      ) : conversations.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          <MessageSquare className="mx-auto mb-3 h-9 w-9 text-primary/40" />
          কোনো কথোপকথন পাওয়া যায়নি
        </div>
      ) : conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          user={user}
          active={String(conversation.id) === String(selectedId)}
          onSelect={() => onSelect(conversation)}
        />
      ))}
    </div>
  );
}
