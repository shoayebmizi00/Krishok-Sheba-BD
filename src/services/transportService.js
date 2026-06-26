import { apiClient } from '@/api/apiClient';

export const transportService = {
  vehicles: {
    list: (sort, limit, page) => apiClient.entities.Vehicle.list(sort, limit, page),
    filter: (filters, sort, limit, page) => apiClient.entities.Vehicle.filter(filters, sort, limit, page),
    get: (id) => apiClient.entities.Vehicle.get(id),
    create: (data) => apiClient.entities.Vehicle.create(data),
    update: (id, data) => apiClient.entities.Vehicle.update(id, data)
  },
  booking: {
    my: () => apiClient.bookings.transport.my(),
    create: (data) => apiClient.bookings.transport.create(data),
    update: (id, data) => apiClient.bookings.transport.update(id, data)
  }
};
