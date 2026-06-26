import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageSquare, Send, User } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ROLE_LABELS } from '@/lib/constants';

const messageBaseForRole = (role) => ({
  farmer: '/farmer/messages',
  buyer: '/buyer-dashboard/messages',
  equipment_owner: '/equipment-owner-dashboard/messages',
  transport_provider: '/transport-dashboard/messages',
  admin: '/admin/messages'
}[role] || '/messages');

const listFromResponse = (response, key) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.[key])) return response[key];
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const recordFromResponse = (response, key) => response?.[key] || response?.data || response;

const formatTime = (value) => value
  ? new Intl.DateTimeFormat('bn-BD', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
  : '';

const formatConversationTime = (value) => value
  ? new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
  : '';

export default function Messages() {
  const outletContext = useOutletContext() || {};
  const { user } = outletContext;
  const { id } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const basePath = messageBaseForRole(user?.role);
  const selectedConversation = conversations.find((conversation) => String(conversation.id) === String(id));

  const loadConversations = useCallback(async (background = false) => {
    try {
      const result = await apiClient.messaging.conversations();
      setConversations(listFromResponse(result, 'conversations'));
    } catch (error) {
      if (!background) {
        toast({ title: 'কথোপকথন লোড করা যায়নি', description: error.message, variant: 'destructive', duration: 3000 });
      }
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (background = false) => {
    if (!id) {
      setMessages([]);
      return;
    }
    if (!background) setChatLoading(true);
    try {
      const result = await apiClient.messaging.conversationMessages(id);
      setMessages(listFromResponse(result, 'messages'));
      await apiClient.messaging.markConversationRead(id);
      setConversations((current) => current.map((conversation) => (
        String(conversation.id) === String(id) ? { ...conversation, unread_count: 0 } : conversation
      )));
    } catch (error) {
      if (!background) {
        toast({ title: 'বার্তা লোড করা যায়নি', description: error.message, variant: 'destructive', duration: 3000 });
      }
    } finally {
      if (!background) setChatLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!user?.id) return undefined;
    loadConversations();
    const timer = window.setInterval(() => loadConversations(true), 6000);
    return () => window.clearInterval(timer);
  }, [user?.id, loadConversations]);

  useEffect(() => {
    loadMessages();
    if (!id) return undefined;
    const timer = window.setInterval(() => loadMessages(true), 6000);
    return () => window.clearInterval(timer);
  }, [id, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !id || sending) return;
    setSending(true);
    try {
      const result = await apiClient.messaging.send({ conversation_id: id, message_text: content });
      const created = recordFromResponse(result, 'message');
      setMessages((current) => [...current, created]);
      setDraft('');
      await loadConversations(true);
      toast({ title: 'বার্তা পাঠানো হয়েছে', duration: 3000 });
    } catch (error) {
      toast({ title: 'বার্তা পাঠানো যায়নি', description: error.message, variant: 'destructive', duration: 3000 });
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="grid min-h-[65vh] md:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${id ? 'hidden md:flex' : 'flex'} min-h-[65vh] flex-col border-r border-border`}>
          <div className="border-b border-border p-4">
            <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <MessageSquare className="h-5 w-5 text-primary" /> বার্তা
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <MessageSquare className="mx-auto mb-3 h-9 w-9 text-primary/40" />
                কোনো কথোপকথন পাওয়া যায়নি
              </div>
            ) : conversations.map((conversation) => {
              const active = String(conversation.id) === String(id);
              const unread = Number(conversation.unread_count || 0);
              const name = conversation.other_name || conversation.participant_names?.find((item) => item !== user.full_name) || 'ব্যবহারকারী';
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => navigate(`${basePath}/${conversation.id}`)}
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
            })}
          </div>
        </aside>

        <section className={`${id ? 'flex' : 'hidden md:flex'} min-h-[65vh] min-w-0 flex-col`}>
          {!id ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <MessageSquare className="mb-3 h-12 w-12 text-primary/30" />
              কথোপকথন নির্বাচন করুন
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border p-3 sm:p-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate(basePath)} aria-label="কথোপকথনের তালিকায় ফিরুন">
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
                ) : messages.map((message) => {
                  const own = String(message.sender_id) === String(user.id);
                  return (
                    <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-lg px-4 py-2.5 ${own ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground'}`}>
                        <p className="whitespace-pre-wrap break-words text-sm">{message.message_text || message.content}</p>
                        <p className={`mt-1 text-right text-[10px] ${own ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{formatTime(message.created_date || message.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-border bg-card p-3 sm:p-4">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="বার্তা লিখুন..."
                    className="max-h-32 min-h-11 resize-none"
                  />
                  <Button onClick={sendMessage} disabled={!draft.trim() || sending} className="h-11 shrink-0 gap-2">
                    <Send className="h-4 w-4" /><span className="hidden sm:inline">{sending ? 'পাঠানো হচ্ছে...' : 'পাঠান'}</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
