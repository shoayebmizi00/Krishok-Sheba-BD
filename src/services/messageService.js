import { apiClient } from '@/api/apiClient';

export const messageService = {
  conversations: () => apiClient.messaging.conversations(),
  createConversation: (data) => apiClient.messaging.createConversation(data),
  startConversation: (receiverId, relatedType, relatedId) => apiClient.messaging.startConversation(receiverId, relatedType, relatedId),
  conversationMessages: (id) => apiClient.messaging.conversationMessages(id),
  send: (data) => apiClient.messaging.send(data),
  markMessageRead: (id) => apiClient.messaging.markMessageRead(id),
  markConversationRead: (id) => apiClient.messaging.markConversationRead(id)
};
