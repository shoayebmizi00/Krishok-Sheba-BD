import { apiClient } from '@/api/apiClient';

export const equipmentService = {
  list: (sort, limit, page) => apiClient.entities.Equipment.list(sort, limit, page),
  filter: (filters, sort, limit, page) => apiClient.entities.Equipment.filter(filters, sort, limit, page),
  get: (id) => apiClient.entities.Equipment.get(id),
  create: (data) => apiClient.entities.Equipment.create(data),
  update: (id, data) => apiClient.entities.Equipment.update(id, data),
  booking: {
    my: () => apiClient.bookings.equipment.my(),
    create: (data) => apiClient.bookings.equipment.create(data),
    update: (id, data) => apiClient.bookings.equipment.update(id, data)
  }
};
