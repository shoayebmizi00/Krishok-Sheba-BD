import React from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ROLE_LABELS } from '@/utils/constants';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

export default function ChatWindow({
  user,
  selectedConversation,
  messages,
  chatLoading,
  draft,
  onDraftChange,
  onSend,
  sending,
  onBack,
  bottomRef
}) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-border p-3 sm:p-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="কথোপকথনের তালিকায় ফিরুন">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><User className="h-5 w-5 text-primary" /></span>
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{selectedConversation?.other_name || selectedConversation?.subject || 'কথোপকথন'}</h2>
          <p className="text-xs text-muted-foreground">{ROLE_LABELS[selectedConversation?.other_role] || selectedConversation?.other_role || ''}</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
        {chatLoading ? <LoadingSpinner /> : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">এখনও কোনো বার্তা নেই। প্রথম বার্তাটি পাঠান।</p>
        ) : messages.map((message) => (
          <MessageBubble key={message.id} message={message} own={String(message.sender_id) === String(user.id)} />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput value={draft} onChange={onDraftChange} onSend={onSend} sending={sending} />
    </>
  );
}
