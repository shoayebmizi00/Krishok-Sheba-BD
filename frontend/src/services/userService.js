import { apiClient } from '@/api/apiClient';

export const userService = {
  list: (sort, limit, page) => apiClient.entities.User.list(sort, limit, page),
  filter: (filters, sort, limit, page) => apiClient.entities.User.filter(filters, sort, limit, page),
  get: (id) => apiClient.entities.User.get(id),
  update: (id, data) => apiClient.entities.User.update(id, data),
  remove: (id) => apiClient.entities.User.delete(id)
};
