import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function EmptyConversation() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <MessageSquare className="mb-3 h-12 w-12 text-primary/30" />
      কথোপকথন নির্বাচন করুন
    </div>
  );
}
