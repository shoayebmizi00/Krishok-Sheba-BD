import { apiClient } from '@/api/apiClient';

export const transactionService = {
  paymentContext: (orderId) => apiClient.transactions.paymentContext(orderId),
  create: (data) => apiClient.transactions.create(data),
  mySent: (page, limit) => apiClient.transactions.mySent(page, limit),
  myReceived: (page, limit) => apiClient.transactions.myReceived(page, limit),
  get: (id) => apiClient.transactions.get(id),
  updateStatus: (id, status) => apiClient.transactions.updateStatus(id, status),
  adminList: (filters) => apiClient.transactions.adminList(filters),
  adminSummary: () => apiClient.transactions.adminSummary()
};
