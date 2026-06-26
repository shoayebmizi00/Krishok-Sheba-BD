import { apiClient } from '@/api/apiClient';

export const cropService = {
  list: (sort, limit, page) => apiClient.entities.CropListing.list(sort, limit, page),
  filter: (filters, sort, limit, page) => apiClient.entities.CropListing.filter(filters, sort, limit, page),
  get: (id) => apiClient.entities.CropListing.get(id),
  create: (data) => apiClient.entities.CropListing.create(data),
  update: (id, data) => apiClient.entities.CropListing.update(id, data),
  remove: (id) => apiClient.entities.CropListing.delete(id)
};
