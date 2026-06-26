import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ChatInput({ value, onChange, onSend, sending }) {
  return (
    <div className="border-t border-border bg-card p-3 sm:p-4">
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="বার্তা লিখুন..."
          className="max-h-32 min-h-11 resize-none"
        />
        <Button onClick={onSend} disabled={!value.trim() || sending} className="h-11 shrink-0 gap-2">
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{sending ? 'পাঠানো হচ্ছে...' : 'পাঠান'}</span>
        </Button>
      </div>
    </div>
  );
}
