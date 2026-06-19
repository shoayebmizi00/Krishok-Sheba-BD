import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { MessageSquare, User } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/constants';

export default function Messages() {
  const { user } = useOutletContext();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const load = async () => {
      const all = await apiClient.entities.Conversation.list('-last_message_date', 100);
      const mine = all.filter(c => c.participant_ids?.includes(user.id));
      setConversations(mine);
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <EmptyState icon={MessageSquare} title="Login required" description="Please login to view your messages" />
      </div>
    );
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><LoadingSpinner /></div>;

  const otherName = (conv) => {
    const i = conv.participant_ids?.indexOf(user.id);
    if (i !== undefined && i >= 0) {
      return conv.participant_names?.[i === 0 ? 1 : 0] || 'User';
    }
    return conv.participant_names?.[0] || 'User';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No messages" description="Start a conversation from a listing or bid" />
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => (
            <Link key={conv.id} to={`/messages/${conv.id}`} className="block p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-foreground truncate">{conv.subject}</h3>
                    {conv.last_message_date && (
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDate(conv.last_message_date)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{otherName(conv)} · {conv.last_message || 'No messages yet'}</p>
                  {conv.listing_name && (
                    <p className="text-xs text-primary mt-0.5">{conv.listing_name}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
