import { apiClient } from '@/api/apiClient';

export const orderService = {
  list: (sort, limit, page) => apiClient.entities.Order.list(sort, limit, page),
  filter: (filters, sort, limit, page) => apiClient.entities.Order.filter(filters, sort, limit, page),
  get: (id) => apiClient.entities.Order.get(id),
  create: (data) => apiClient.entities.Order.create(data),
  update: (id, data) => apiClient.entities.Order.update(id, data)
};
