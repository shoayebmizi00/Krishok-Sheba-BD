import { apiClient } from '@/api/apiClient';

export const storyService = {
  list: (sort, limit, page) => apiClient.entities.Story.list(sort, limit, page),
  filter: (filters, sort, limit, page) => apiClient.entities.Story.filter(filters, sort, limit, page),
  get: (id) => apiClient.entities.Story.get(id),
  create: (data) => apiClient.entities.Story.create(data),
  update: (id, data) => apiClient.entities.Story.update(id, data)
};
