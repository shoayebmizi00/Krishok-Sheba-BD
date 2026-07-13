import { localApi } from './localApi.js';

const DEFAULT_API_URL = import.meta.env.PROD
  ? 'https://krishok-sheba-bd.onrender.com'
  : 'http://localhost:5000/api';
const configuredApiUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
const API_URL = configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`;
const TOKEN_KEY = 'krishok_sheba_token';
const USE_LOCAL_API = import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_API !== 'false';
const REQUEST_TIMEOUT_MS = 30000;

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function hasToken() {
  return Boolean(getToken());
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

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw new Error('Cannot connect to the server. Please try again shortly.');
  } finally {
    window.clearTimeout(timeout);
  }

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
  MarketPrice: 'market-prices',
  Story: 'stories',
  AppSetting: 'app-settings'
};

function entityClient(route) {
  const query = (filters = {}, sort, limit, page) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, value);
    });
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', limit);
    if (page) params.set('page', page);
    const suffix = params.size ? `?${params}` : '';
    return request(`/${route}${suffix}`);
  };

  return {
    list: (sort, limit, page) => query({}, sort, limit, page),
    filter: (filters, sort, limit, page) => query(filters, sort, limit, page),
    get: (id) => request(`/${route}/${id}`),
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
  transactions: {
    paymentContext: (orderId) => request(`/transactions/payment-context/${orderId}`),
    create: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    mySent: (page = 1, limit = 20) => request(`/transactions/my-sent?page=${page}&limit=${limit}`),
    myReceived: (page = 1, limit = 20) => request(`/transactions/my-received?page=${page}&limit=${limit}`),
    get: (id) => request(`/transactions/${id}`),
    updateStatus: (id, status) => request(`/transactions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
    adminList: (filters = {}) => {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null));
      return request(`/admin/transactions?${params}`);
    },
    adminSummary: () => request('/admin/transactions/summary')
  },
  dashboard: {
    farmerSummary: () => request('/dashboard/farmer-summary'),
    adminSummary: () => request('/dashboard/admin-summary')
  },
  bookings: {
    equipment: {
      my: () => request('/equipment-bookings/my'),
      create: (data) => request('/equipment-bookings', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/equipment-bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    },
    transport: {
      my: () => request('/transport-bookings/my'),
      create: (data) => request('/transport-bookings', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/transport-bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    }
  },
  messaging: {
    conversations: () => request('/conversations'),
    createConversation: (data) => request('/conversations', { method: 'POST', body: JSON.stringify(data) }),
    startConversation: (receiverId, relatedType = 'general', relatedId = null) => request('/conversations', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId, related_type: relatedType, related_id: relatedId })
    }),
    conversationMessages: (id) => request(`/conversations/${id}/messages`),
    send: (data) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
    markMessageRead: (id) => request(`/messages/${id}/read`, { method: 'PATCH', body: '{}' }),
    markConversationRead: (id) => request(`/conversations/${id}/read`, { method: 'PATCH', body: '{}' })
  },
  availability: {
    equipment: (id, startDate, endDate) => request(`/availability/equipment/${id}?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`),
    transport: (id, pickupDate) => request(`/availability/transport/${id}?pickup_date=${encodeURIComponent(pickupDate)}`)
  },
  auth: {
    hasSession: hasToken,
    async register(data) {
      const result = await request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
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
    }),
    verifyEmail: (token) => request(`/auth/verify-email?token=${encodeURIComponent(token)}`),
    resendVerification: (email) => request('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) })
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
