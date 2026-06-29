import { apiClient } from '@/api/apiClient';

export const bidService = {
  list: (sort, limit, page) => apiClient.entities.Bid.list(sort, limit, page),
  filter: (filters, sort, limit, page) => apiClient.entities.Bid.filter(filters, sort, limit, page),
  get: (id) => apiClient.entities.Bid.get(id),
  create: (data) => apiClient.entities.Bid.create(data),
  update: (id, data) => apiClient.entities.Bid.update(id, data)
};
