import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { adminList, adminSummary, createTransaction, getTransaction, myReceived, mySent, paymentContext, updateStatus } from '../controllers/transactionController.js';

export const transactionRouter = Router();
transactionRouter.use(authenticate);
transactionRouter.get('/payment-context/:orderId', paymentContext);
transactionRouter.get('/my-sent', mySent);
transactionRouter.get('/my-received', myReceived);
transactionRouter.post('/', createTransaction);
transactionRouter.get('/:id', getTransaction);
transactionRouter.patch('/:id/status', updateStatus);

export const adminTransactionRouter = Router();
adminTransactionRouter.use(authenticate, authorizeRoles('admin'));
adminTransactionRouter.get('/summary', adminSummary);
adminTransactionRouter.get('/', adminList);
