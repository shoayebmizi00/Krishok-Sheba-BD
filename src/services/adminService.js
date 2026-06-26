import { apiClient } from '@/api/apiClient';

export const adminService = {
  dashboardSummary: () => apiClient.dashboard.adminSummary(),
  transactions: {
    list: (filters) => apiClient.transactions.adminList(filters),
    summary: () => apiClient.transactions.adminSummary()
  }
};
