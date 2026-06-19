import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { ArrowLeft, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function ConversationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const convs = await apiClient.entities.Conversation.filter({ id });
      if (convs.length > 0) {
        setConversation(convs[0]);
        const msgs = await apiClient.entities.Message.filter({ conversation_id: id }, 'created_date', 200);
        setMessages(msgs);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!conversation?.id || !user?.id) return;
    const interval = window.setInterval(async () => {
      try {
        const latest = await apiClient.entities.Message.filter({ conversation_id: id }, 'created_date', 200);
        setMessages(latest);
      } catch {
        // Keep the current messages when a background refresh fails.
      }
    }, 4000);
    return () => window.clearInterval(interval);
  }, [id, conversation?.id, user?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !user) return;
    setSending(true);
    const msg = await apiClient.entities.Message.create({
      conversation_id: id,
      sender_id: user.id,
      sender_name: user.full_name || 'User',
      content: newMsg.trim()
    });
    setMessages(prev => [...prev, msg]);
    await apiClient.entities.Conversation.update(id, {
      last_message: newMsg.trim(),
      last_message_by: user.id,
      last_message_date: new Date().toISOString()
    });
    setNewMsg('');
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><LoadingSpinner /></div>;
  if (!conversation) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="font-heading font-bold text-xl">Conversation not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/messages')}>Back to Messages</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg text-foreground truncate">{conversation.subject}</h1>
            {conversation.listing_name && (
              <p className="text-xs text-primary">{conversation.listing_name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-muted/30 rounded-2xl border border-border p-4 mb-4 min-h-[400px] max-h-[60vh] overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border text-foreground rounded-bl-md'
                }`}>
                  {!isMine && (
                    <p className="text-xs font-medium text-primary mb-0.5">{msg.sender_name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!newMsg.trim() || sending} className="gap-2">
          <Send className="w-4 h-4" /> Send
        </Button>
      </div>
    </div>
  );
}
