import { createMockDatabase, demoUsers } from './mockData.js';

const DATABASE_KEY = 'krishok_sheba_demo_database_v1';
const SESSION_KEY = 'krishok_sheba_demo_user';

const clone = (value) => structuredClone(value);

function normalizeRecord(record) {
  const normalized = { ...record };
  if (normalized.created_at && !normalized.created_date) normalized.created_date = normalized.created_at;
  if (normalized.updated_at && !normalized.updated_date) normalized.updated_date = normalized.updated_at;
  return normalized;
}

function loadDatabase() {
  try {
    const saved = localStorage.getItem(DATABASE_KEY);
    return saved ? JSON.parse(saved) : createMockDatabase();
  } catch {
    return createMockDatabase();
  }
}

let database = loadDatabase();

function saveDatabase() {
  localStorage.setItem(DATABASE_KEY, JSON.stringify(database));
}

function publicUser(user) {
  if (!user) return null;
  const { password: _password, ...safeUser } = user;
  return clone(safeUser);
}

function getCurrentUser() {
  const id = localStorage.getItem(SESSION_KEY);
  return database.User.find((user) => user.id === id) || null;
}

function makeError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function addNotification(userId, title, message, type = 'system', link = '/notifications') {
  if (!userId) return;
  database.Notification = [{
    id: `notification-${crypto.randomUUID()}`,
    user_id: userId,
    title,
    message,
    type,
    link,
    is_read: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, ...(database.Notification || [])];
}

function normalizeSortField(field) {
  if (field === 'created_date') return 'created_at';
  if (field === 'updated_date') return 'updated_at';
  return field;
}

function entityClient(name) {
  const list = (sort, limit, filters = {}, page = 1) => {
    let records = database[name] || [];
    records = records.filter((record) => Object.entries(filters).every(([key, value]) => {
      if (Array.isArray(record[key])) return record[key].includes(value);
      return String(record[key] ?? '') === String(value);
    }));

    if (sort) {
      const descending = sort.startsWith('-');
      const field = normalizeSortField(descending ? sort.slice(1) : sort);
      records = [...records].sort((left, right) => {
        const a = left[field] ?? '';
        const b = right[field] ?? '';
        return (a > b ? 1 : a < b ? -1 : 0) * (descending ? -1 : 1);
      });
    }

    const offset = limit ? (Math.max(Number(page) || 1, 1) - 1) * limit : 0;
    const result = (limit ? records.slice(offset, offset + limit) : records).map(normalizeRecord);
    return Promise.resolve(clone(result));
  };

  return {
    list: (sort, limit, page) => list(sort, limit, {}, page),
    filter: (filters, sort, limit, page) => list(sort, limit, filters, page),
    async create(data) {
      const currentUser = getCurrentUser();
      if (name === 'CropListing') {
        if (currentUser?.role !== 'farmer') throw makeError('Only farmers can upload crops.', 403);
        data = {
          ...data,
          farmer_id: currentUser.id,
          farmer_name: currentUser.full_name || 'কৃষক',
          status: 'pending'
        };
      }
      if (name === 'Equipment') data = { ...data, owner_id: currentUser?.id, owner_name: currentUser?.full_name, approval_status: currentUser?.role === 'admin' ? 'approved' : 'pending' };
      if (name === 'Vehicle') data = { ...data, owner_id: currentUser?.id, owner_name: currentUser?.full_name, approval_status: currentUser?.role === 'admin' ? 'approved' : 'pending' };
      if (name === 'Bid') {
        const listing = database.CropListing.find((item) => item.id === data.listing_id);
        const remaining = Number(listing?.remaining_quantity ?? listing?.quantity ?? 0);
        const requested = Number(data.quantity_requested || 0);
        if (!listing || ['sold', 'sold_out'].includes(listing.status) || remaining <= 0) throw makeError('এই ফসলটি বিক্রি শেষ', 409);
        if (requested <= 0 || requested > remaining) throw makeError(`সর্বোচ্চ ${remaining} ${listing.unit || 'কেজি'} বিড করা যাবে`, 400);
      }
      if (name === 'Conversation') {
        const participantIds = [...new Set(data.participant_ids || [])];
        if (!currentUser || participantIds.length !== 2 || !participantIds.includes(currentUser.id)) {
          throw makeError('A conversation must include you and one other user');
        }
        const existing = (database.Conversation || []).find((conversation) =>
          conversation.listing_id === data.listing_id
          && participantIds.every((id) => conversation.participant_ids?.includes(id))
        );
        if (existing) return clone(normalizeRecord(existing));
        data = {
          ...data,
          participant_ids: participantIds,
          participant_names: participantIds.map((id) =>
            database.User.find((user) => user.id === id)?.full_name || 'User'
          )
        };
      }
      if (name === 'Message') {
        const conversation = database.Conversation.find((item) => item.id === data.conversation_id);
        if (!currentUser || !conversation?.participant_ids?.includes(currentUser.id)) {
          throw makeError('You are not a participant in this conversation', 403);
        }
        data = {
          ...data,
          sender_id: currentUser.id,
          receiver_id: conversation.participant_ids.find((id) => id !== currentUser.id),
          sender_name: currentUser.full_name || 'User',
          content: String(data.content || '').trim()
        };
        if (!data.content) throw makeError('Message cannot be empty');
      }
      if (name === 'Story') {
        if (!currentUser) throw makeError('Authentication required', 401);
        data = {
          ...data,
          author_id: currentUser.id,
          author_name: currentUser.full_name,
          district: data.district || currentUser.district,
          status: currentUser.role === 'admin' ? (data.status || 'approved') : 'pending'
        };
      }
      if (name === 'Order') {
        const bid = database.Bid.find((item) => item.id === data.bid_id && item.buyer_id === currentUser?.id);
        const listing = database.CropListing.find((item) => item.id === bid?.listing_id);
        const quantity = Number(data.items?.[0]?.quantity);
        if (!bid || bid.status !== 'accepted') throw makeError('শুধু গৃহীত বিড থেকে অর্ডার করা যাবে', 400);
        if (!listing || ['sold', 'sold_out'].includes(listing.status)) throw makeError('এই ফসলটি বিক্রি শেষ', 409);
        const remaining = Number(listing.remaining_quantity ?? listing.quantity);
        if (!quantity || quantity > remaining) throw makeError(`সর্বোচ্চ ${remaining} ${listing.unit || 'কেজি'} অর্ডার করা যাবে`, 409);
        if (database.Order.some((item) => item.bid_id === bid.id)) throw makeError('এই বিড থেকে ইতিমধ্যে অর্ডার তৈরি হয়েছে', 409);
        listing.total_quantity = Number(listing.total_quantity ?? listing.quantity);
        listing.sold_quantity = Number(listing.sold_quantity || 0) + quantity;
        listing.remaining_quantity = remaining - quantity;
        listing.status = listing.remaining_quantity <= 0 ? 'sold_out' : 'active';
        data = {
          ...data,
          buyer_id: currentUser.id,
          seller_id: bid.farmer_id,
          seller_name: listing.farmer_name || 'কৃষক',
          total_amount: quantity * Number(bid.bid_amount),
          items: [{ ...data.items[0], listing_id: listing.id, unit: listing.unit, price: Number(bid.bid_amount) }]
        };
      }
      const created = {
        ...clone(data),
        id: `${name.toLowerCase()}-${crypto.randomUUID()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      database[name] = [created, ...(database[name] || [])];
      if (name === 'Bid') addNotification(created.farmer_id, 'নতুন বিড এসেছে', `${created.crop_name || 'আপনার ফসল'}-এর জন্য নতুন বিড এসেছে।`, 'bid', '/farmer-dashboard/bids');
      if (name === 'Order') addNotification(created.seller_id, 'নতুন অর্ডার', `${created.buyer_name || 'একজন ক্রেতা'} নতুন অর্ডার করেছেন।`, 'order', '/farmer-dashboard/orders');
      if (name === 'EquipmentBooking') addNotification(created.owner_id, 'নতুন যন্ত্রপাতি বুকিং', `${created.equipment_name || 'যন্ত্রপাতি'} বুকিংয়ের অনুরোধ এসেছে।`, 'booking', '/equipment-owner-dashboard/bookings');
      if (name === 'TransportBooking') addNotification(created.provider_id, 'নতুন পরিবহন বুকিং', 'একটি নতুন পরিবহন বুকিং অনুরোধ এসেছে।', 'booking', '/transport-dashboard/bookings');
      if (name === 'Transaction') addNotification(created.seller_id, 'নতুন পেমেন্ট রেকর্ড', `${created.amount || 0} টাকার একটি লেনদেন পাঠানো হয়েছে।`, 'payment', '/farmer-dashboard/transactions');
      if (name === 'Message') {
        const conversation = database.Conversation.find((item) => item.id === created.conversation_id);
        if (conversation) {
          conversation.last_message = created.content;
          conversation.last_message_by = created.sender_id;
          conversation.last_message_date = created.created_at;
          conversation.updated_at = created.created_at;
        }
        addNotification(created.receiver_id, 'নতুন বার্তা', `${created.sender_name} আপনাকে একটি বার্তা পাঠিয়েছেন।`, 'message', `/messages/${created.conversation_id}`);
      }
      saveDatabase();
      return clone(normalizeRecord(created));
    },
    async update(id, data) {
      const index = (database[name] || []).findIndex((record) => record.id === id);
      if (index < 0) throw makeError(`${name} not found`, 404);
      const previous = database[name][index];
      database[name][index] = {
        ...database[name][index],
        ...clone(data),
        updated_at: new Date().toISOString()
      };
      if (name === 'Bid' && data.status && data.status !== previous.status) {
        addNotification(previous.buyer_id, data.status === 'accepted' ? 'বিড গ্রহণ করা হয়েছে' : 'বিডের অবস্থা পরিবর্তন হয়েছে', `${previous.crop_name || 'ফসল'}-এর বিড ${data.status === 'accepted' ? 'গ্রহণ' : 'আপডেট'} করা হয়েছে।`, 'bid', '/buyer-dashboard/orders');
      }
      if (['EquipmentBooking', 'TransportBooking'].includes(name) && data.status && data.status !== previous.status) {
        addNotification(previous.farmer_id, 'বুকিংয়ের অবস্থা পরিবর্তন হয়েছে', `আপনার বুকিংটি এখন ${data.status} অবস্থায় আছে।`, 'booking', name === 'EquipmentBooking' ? '/farmer-dashboard/equipment-bookings' : '/farmer-dashboard/transport-requests');
      }
      if (name === 'Transaction' && data.status && data.status !== previous.status) {
        addNotification(previous.buyer_id, 'লেনদেনের অবস্থা পরিবর্তন হয়েছে', `${previous.amount || 0} টাকার লেনদেনটি এখন ${data.status} অবস্থায় আছে।`, 'payment', '/buyer-dashboard/transactions');
      }
      if (name === 'User' && Object.hasOwn(data, 'is_active') && data.is_active !== previous.is_active) {
        addNotification(previous.id, data.is_active ? 'অ্যাকাউন্ট সক্রিয় করা হয়েছে' : 'অ্যাকাউন্ট স্থগিত করা হয়েছে', data.is_active ? 'প্রশাসক আপনার অ্যাকাউন্ট সক্রিয় করেছেন।' : 'প্রশাসক আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করেছেন।');
      }
      saveDatabase();
      return clone(normalizeRecord(database[name][index]));
    },
    async delete(id) {
      database[name] = (database[name] || []).filter((record) => record.id !== id);
      saveDatabase();
      return null;
    }
  };
}

const entities = Object.fromEntries(
  Object.keys(createMockDatabase()).map((name) => [name, entityClient(name)])
);

export const localApi = {
  entities,
  availability: {
    async equipment(id, startDate, endDate) {
      const conflict = (database.EquipmentBooking || []).some((booking) =>
        booking.equipment_id === id
        && ['pending', 'confirmed', 'active'].includes(booking.status)
        && booking.start_date <= endDate
        && booking.end_date >= startDate
      );
      return { available: !conflict };
    },
    async transport(id, pickupDate) {
      const conflict = (database.TransportBooking || []).some((booking) =>
        booking.vehicle_id === id
        && booking.pickup_date === pickupDate
        && ['pending', 'confirmed', 'in_transit'].includes(booking.status)
      );
      return { available: !conflict };
    }
  },
  auth: {
    async register(data) {
      if (database.User.some((user) => user.email.toLowerCase() === data.email.toLowerCase())) {
        throw makeError('An account with this email already exists', 409);
      }
      const user = {
        id: `user-${crypto.randomUUID()}`,
        email: data.email.trim().toLowerCase(),
        password: data.password,
        full_name: data.full_name,
        role: data.role || 'farmer',
        district: '',
        is_active: true,
        created_at: new Date().toISOString()
      };
      database.User.unshift(user);
      localStorage.setItem(SESSION_KEY, user.id);
      saveDatabase();
      return { token: `demo-token-${user.id}`, user: publicUser(user) };
    },
    async login(email, password) {
      const user = database.User.find((candidate) =>
        candidate.email.toLowerCase() === email.trim().toLowerCase() &&
        candidate.password === password
      );
      if (!user || !user.is_active) throw makeError('Invalid email or password', 401);
      localStorage.setItem(SESSION_KEY, user.id);
      return { token: `demo-token-${user.id}`, user: publicUser(user) };
    },
    logout(redirectTo) {
      localStorage.removeItem(SESSION_KEY);
      if (redirectTo !== false) {
        window.location.assign(typeof redirectTo === 'string' ? redirectTo : '/');
      }
    },
    async me() {
      const user = getCurrentUser();
      if (!user) throw makeError('Authentication required', 401);
      return publicUser(user);
    },
    async updateMe(data) {
      const user = getCurrentUser();
      if (!user) throw makeError('Authentication required', 401);
      Object.assign(user, clone(data), { updated_at: new Date().toISOString() });
      saveDatabase();
      return publicUser(user);
    },
    async isAuthenticated() {
      return Boolean(getCurrentUser());
    },
    async requestPasswordReset(email) {
      const exists = demoUsers.some((user) => user.email === email.trim().toLowerCase());
      return { message: exists ? 'Demo reset request accepted.' : 'If the account exists, a reset link will be sent.' };
    },
    async resetPassword() {
      return { message: 'Password reset is simulated in local demo mode.' };
    }
  },
  async upload(file, folder = 'crops') {
    const currentUser = getCurrentUser();
    if (folder === 'crops' && currentUser?.role !== 'farmer') {
      throw makeError('Only farmers can upload crop images.', 403);
    }
    return {
      file_url: URL.createObjectURL(file),
      folder,
      filename: file.name
    };
  },
  resetDemoData() {
    database = createMockDatabase();
    saveDatabase();
  }
};
