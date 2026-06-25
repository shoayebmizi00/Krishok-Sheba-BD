import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createConversation, getConversationMessages, listConversations, markConversationRead,
  markMessageRead, sendMessage
} from '../controllers/messagingController.js';

export const conversationRouter = Router();
conversationRouter.use(authenticate);
conversationRouter.get('/', listConversations);
conversationRouter.post('/', createConversation);
conversationRouter.get('/:id/messages', getConversationMessages);
conversationRouter.patch('/:id/read', markConversationRead);

export const messageRouter = Router();
messageRouter.use(authenticate);
messageRouter.post('/', sendMessage);
messageRouter.patch('/:id/read', markMessageRead);
