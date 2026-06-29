import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import ChatWindow from '@/components/messages/ChatWindow';
import ConversationList from '@/components/messages/ConversationList';
import EmptyConversation from '@/components/messages/EmptyConversation';
import { messageService } from '@/services/messageService';

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
      const result = await messageService.conversations();
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
      const result = await messageService.conversationMessages(id);
      setMessages(listFromResponse(result, 'messages'));
      await messageService.markConversationRead(id);
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
      const result = await messageService.send({ conversation_id: id, message_text: content });
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
          <ConversationList
            conversations={conversations}
            loading={loading}
            selectedId={id}
            user={user}
            onSelect={(conversation) => navigate(`${basePath}/${conversation.id}`)}
          />
        </aside>

        <section className={`${id ? 'flex' : 'hidden md:flex'} min-h-[65vh] min-w-0 flex-col`}>
          {!id ? (
            <EmptyConversation />
          ) : (
            <ChatWindow
              user={user}
              selectedConversation={selectedConversation}
              messages={messages}
              chatLoading={chatLoading}
              draft={draft}
              onDraftChange={setDraft}
              onSend={sendMessage}
              sending={sending}
              onBack={() => navigate(basePath)}
              bottomRef={bottomRef}
            />
          )}
        </section>
      </div>
    </div>
  );
}
