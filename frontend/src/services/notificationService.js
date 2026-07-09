import { apiClient } from '@/api/apiClient';

export const notificationService = {
  list: (sort, limit, page) => apiClient.entities.Notification.list(sort, limit, page),
  filter: (filters, sort, limit, page) => apiClient.entities.Notification.filter(filters, sort, limit, page),
  update: (id, data) => apiClient.entities.Notification.update(id, data)
};

export const loadUserNotifications = (userId) => (
  notificationService.filter({ user_id: userId }, '-created_date')
);
