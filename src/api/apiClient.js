import { localApi } from './localApi.js';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'krishok_sheba_token';
const USE_LOCAL_API = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_API !== 'false';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    error.data = payload;
    throw error;
  }
  return payload;
}

const entityRoutes = {
  User: 'users',
  CropListing: 'crop-listings',
  Bid: 'bids',
  Conversation: 'conversations',
  Message: 'messages',
  Equipment: 'equipment',
  EquipmentBooking: 'equipment-bookings',
  Vehicle: 'vehicles',
  TransportBooking: 'transport-bookings',
  Order: 'orders',
  Product: 'products',
  Transaction: 'transactions',
  Notification: 'notifications',
  GovernmentNotice: 'government-notices',
  MarketPrice: 'market-prices'
};

function entityClient(route) {
  const query = (filters = {}, sort, limit) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, value);
    });
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', limit);
    const suffix = params.size ? `?${params}` : '';
    return request(`/${route}${suffix}`);
  };

  return {
    list: (sort, limit) => query({}, sort, limit),
    filter: (filters, sort, limit) => query(filters, sort, limit),
    create: (data) => request(`/${route}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/${route}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/${route}/${id}`, { method: 'DELETE' })
  };
}

const entities = Object.fromEntries(
  Object.entries(entityRoutes).map(([name, route]) => [name, entityClient(route)])
);

const remoteApi = {
  entities,
  auth: {
    async register(data) {
      const result = await request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
      setToken(result.token);
      return result;
    },
    async login(email, password) {
      const result = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setToken(result.token);
      return result;
    },
    logout(redirectTo) {
      setToken(null);
      if (redirectTo !== false) window.location.assign(typeof redirectTo === 'string' ? redirectTo : '/');
    },
    me: () => request('/auth/me'),
    updateMe: (data) => request('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
    isAuthenticated: async () => {
      if (!getToken()) return false;
      try {
        await request('/auth/me');
        return true;
      } catch {
        setToken(null);
        return false;
      }
    },
    requestPasswordReset: (email) => request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
    resetPassword: (token, newPassword) => request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    })
  },
  async upload(file, folder = 'crops') {
    const form = new FormData();
    form.append('file', file);
    return request(`/uploads/${folder}`, { method: 'POST', body: form });
  }
};

export const apiClient = USE_LOCAL_API ? localApi : remoteApi;

if (import.meta.env.DEV) {
  console.info(`[KRISHOK-SHEBA] API mode: ${USE_LOCAL_API ? 'local demo data' : API_URL}`);
}
