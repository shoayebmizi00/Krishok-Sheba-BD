import React from 'react';

const formatTime = (value) => value
  ? new Intl.DateTimeFormat('bn-BD', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
  : '';

export default function MessageBubble({ message, own }) {
  return (
    <div className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] rounded-lg px-4 py-2.5 ${own ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground'}`}>
        <p className="whitespace-pre-wrap break-words text-sm">{message.message_text || message.content}</p>
        <p className={`mt-1 text-right text-[10px] ${own ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{formatTime(message.created_date || message.created_at)}</p>
      </div>
    </div>
  );
}
