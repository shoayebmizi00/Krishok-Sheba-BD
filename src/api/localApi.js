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
    async get(id) {
      const record = (database[name] || []).find((item) => item.id === id);
      if (!record) throw makeError(`${name} পাওয়া যায়নি`, 404);
      return clone(normalizeRecord(record));
    },
    async create(data) {
      const currentUser = getCurrentUser();
      if (name === 'CropListing') {
        if (currentUser?.role !== 'farmer') throw makeError('Only farmers can upload crops.', 403);
        data = {
          ...data,
          farmer_id: currentUser.id,
          farmer_name: currentUser.full_name || 'কৃষক',
          status: 'active'
        };
      }
      if (name === 'Equipment') data = { ...data, owner_id: currentUser?.id, owner_name: currentUser?.full_name, approval_status: 'approved' };
      if (name === 'Vehicle') data = { ...data, owner_id: currentUser?.id, owner_name: currentUser?.full_name, approval_status: 'approved' };
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
      if (name === 'EquipmentBooking') {
        const equipment = database.Equipment.find((item) => item.id === data.equipment_id);
        if (!currentUser || currentUser.role !== 'farmer' || !equipment) throw makeError('যন্ত্রপাতি বুকিং করা যাচ্ছে না', 403);
        const days = Math.max(1, Math.floor((new Date(data.end_date) - new Date(data.start_date)) / 86400000) + 1);
        data = {
          ...data, equipment_name: equipment.name, farmer_id: currentUser.id, farmer_name: currentUser.full_name,
          owner_id: equipment.owner_id, owner_name: equipment.owner_name, rental_days: days,
          quantity: Number(data.quantity || 1), total_cost: days * Number(equipment.rent_price_per_day || 0), status: 'pending'
        };
      }
      if (name === 'TransportBooking') {
        const vehicle = database.Vehicle.find((item) => item.id === data.vehicle_id);
        if (!currentUser || currentUser.role !== 'farmer' || !vehicle) throw makeError('পরিবহন বুকিং করা যাচ্ছে না', 403);
        data = {
          ...data, vehicle_type: vehicle.vehicle_type, farmer_id: currentUser.id, farmer_name: currentUser.full_name,
          provider_id: vehicle.owner_id, provider_name: vehicle.owner_name,
          estimated_cost: Number(data.estimated_cost || vehicle.price_per_km * 50), status: 'pending'
        };
      }
      if (name === 'Order') {
        if (currentUser?.role !== 'buyer') throw makeError('শুধু ক্রেতা অর্ডার তৈরি করতে পারবেন', 403);
        const bid = database.Bid.find((item) => item.id === data.bid_id);
        if (!bid) throw makeError('বিড পাওয়া যায়নি', 404);
        if (bid.buyer_id !== currentUser.id) throw makeError('এই বিড থেকে অর্ডার করার অনুমতি নেই', 403);
        const listing = database.CropListing.find((item) => item.id === bid?.listing_id);
        const quantity = Number(data.quantity ?? data.items?.[0]?.quantity);
        if (bid.status !== 'accepted') throw makeError('শুধু গ্রহণ করা বিড থেকে অর্ডার করা যাবে', 400);
        if (data.crop_listing_id && data.crop_listing_id !== listing?.id) throw makeError('বিড ও ফসলের তালিকার তথ্য মিলছে না', 400);
        if (!listing || ['sold', 'sold_out'].includes(listing.status)) throw makeError('এই ফসলটি বিক্রি শেষ', 409);
        const remaining = Number(listing.remaining_quantity ?? listing.quantity);
        if (!quantity || quantity <= 0) throw makeError('সঠিক পরিমাণ দিন', 400);
        if (quantity > remaining) throw makeError('পর্যাপ্ত পরিমাণ ফসল নেই', 409);
        if (Number(bid.quantity_requested) > 0 && quantity > Number(bid.quantity_requested)) throw makeError('গৃহীত বিডের পরিমাণের বেশি অর্ডার করা যাবে না', 400);
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
          delivery_address: data.delivery_location || data.delivery_address,
          delivery_district: data.district || data.delivery_district,
          items: [{ ...(data.items?.[0] || {}), name: bid.crop_name, quantity, listing_id: listing.id, unit: listing.unit, price: Number(bid.bid_amount) }]
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
      if (name === 'Order') {
        addNotification(created.seller_id, 'নতুন অর্ডার পাওয়া গেছে', `${created.buyer_name || 'একজন ক্রেতা'} নতুন অর্ডার করেছেন।`, 'order', '/farmer-dashboard/orders');
        addNotification(created.buyer_id, 'অর্ডার সফলভাবে তৈরি হয়েছে', 'আপনার অর্ডার সফলভাবে তৈরি হয়েছে।', 'order', '/buyer-dashboard/orders');
      }
      if (name === 'EquipmentBooking') {
        addNotification(created.owner_id, 'নতুন যন্ত্রপাতি বুকিং', `${created.equipment_name || 'যন্ত্রপাতি'} বুকিংয়ের অনুরোধ এসেছে।`, 'booking', '/equipment-owner-dashboard/bookings');
        addNotification(created.farmer_id, 'যন্ত্রপাতি বুকিং জমা হয়েছে', 'আপনার যন্ত্রপাতি বুকিং সফলভাবে জমা হয়েছে।', 'booking', '/farmer/equipment-booking');
      }
      if (name === 'TransportBooking') {
        addNotification(created.provider_id, 'নতুন পরিবহন অনুরোধ', 'একটি নতুন পরিবহন বুকিং অনুরোধ এসেছে।', 'booking', '/transport-dashboard/bookings');
        addNotification(created.farmer_id, 'পরিবহন অনুরোধ জমা হয়েছে', 'আপনার পরিবহন অনুরোধ সফলভাবে জমা হয়েছে।', 'booking', '/farmer/transport-request');
      }
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
        const equipmentMessages = {
          approved: ['যন্ত্রপাতি বুকিং অনুমোদিত', 'আপনার যন্ত্রপাতি বুকিং অনুমোদন করা হয়েছে।'],
          rejected: ['যন্ত্রপাতি বুকিং প্রত্যাখ্যাত', 'আপনার যন্ত্রপাতি বুকিং প্রত্যাখ্যান করা হয়েছে।'],
          completed: ['যন্ত্রপাতি বুকিং সম্পন্ন', 'আপনার যন্ত্রপাতি বুকিং সম্পন্ন হয়েছে।']
        };
        const transportMessages = {
          accepted: ['পরিবহন অনুরোধ গ্রহণ করা হয়েছে', 'আপনার পরিবহন অনুরোধ গ্রহণ করা হয়েছে।'],
          rejected: ['পরিবহন অনুরোধ প্রত্যাখ্যাত', 'আপনার পরিবহন অনুরোধ প্রত্যাখ্যান করা হয়েছে।'],
          completed: ['পরিবহন বুকিং সম্পন্ন হয়েছে', 'পরিবহন বুকিং সম্পন্ন হয়েছে।']
        };
        const message = (name === 'EquipmentBooking' ? equipmentMessages : transportMessages)[data.status]
          || ['বুকিংয়ের অবস্থা পরিবর্তন হয়েছে', 'আপনার বুকিংয়ের অবস্থা পরিবর্তন করা হয়েছে।'];
        addNotification(previous.farmer_id, message[0], message[1], 'booking', name === 'EquipmentBooking' ? '/farmer/equipment-booking' : '/farmer/transport-request');
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

const transactionApi = {
  async paymentContext(orderId) {
    const user = getCurrentUser();
    const order = database.Order.find((item) => item.id === orderId && (item.buyer_id === user?.id || user?.role === 'admin'));
    if (!order) throw makeError('অর্ডার পাওয়া যায়নি', 404);
    const seller = database.User.find((item) => item.id === order.seller_id) || {};
    return clone(normalizeRecord({ ...order,
      bkash_number: seller.bkash_number, nagad_number: seller.nagad_number,
      rocket_number: seller.rocket_number, upay_number: seller.upay_number,
      bank_name: seller.bank_name, bank_account_number: seller.bank_account_number,
      account_holder_name: seller.account_holder_name, branch_name: seller.branch_name
    }));
  },
  async create(data) {
    const user = getCurrentUser();
    const order = database.Order.find((item) => item.id === data.order_id && item.buyer_id === user?.id);
    if (!order) throw makeError('এই অর্ডারের জন্য পেমেন্ট পাঠানোর অনুমতি নেই', 403);
    const seller = database.User.find((item) => item.id === order.seller_id) || {};
    const created = {
      ...clone(data),
      id: `transaction-${crypto.randomUUID()}`,
      transaction_code: `KSB-${Date.now().toString(36).toUpperCase()}`,
      user_id: user.id,
      buyer_id: user.id,
      seller_id: order.seller_id,
      buyer_name: user.full_name,
      seller_name: order.seller_name,
      items: order.items,
      type: 'purchase',
      status: data.payment_method === 'cash_on_delivery' ? 'cod_pending' : 'sent',
      receiver_number: seller[`${data.payment_method}_number`] || null,
      receiver_bank: data.payment_method === 'bank_transfer' ? seller.bank_name : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    database.Transaction.unshift(created);
    addNotification(order.seller_id, 'নতুন পেমেন্ট তথ্য পাওয়া গেছে', `${user.full_name} পেমেন্ট তথ্য পাঠিয়েছেন।`, 'payment', '/farmer-dashboard/transactions');
    saveDatabase();
    return clone(normalizeRecord(created));
  },
  async mySent(page = 1, limit = 20) {
    const user = getCurrentUser();
    const items = (database.Transaction || []).filter((item) => item.buyer_id === user?.id || item.user_id === user?.id);
    return { items: clone(items.slice((page - 1) * limit, page * limit).map(normalizeRecord)), pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) } };
  },
  async myReceived(page = 1, limit = 20) {
    const user = getCurrentUser();
    const items = (database.Transaction || []).filter((item) => item.seller_id === user?.id || item.user_id === user?.id);
    return { items: clone(items.slice((page - 1) * limit, page * limit).map(normalizeRecord)), pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) } };
  },
  async get(id) {
    const user = getCurrentUser();
    const item = database.Transaction.find((tx) => tx.id === id && (user?.role === 'admin' || [tx.buyer_id, tx.seller_id, tx.user_id].includes(user?.id)));
    if (!item) throw makeError('লেনদেন পাওয়া যায়নি', 404);
    return clone(normalizeRecord(item));
  },
  async updateStatus(id, status) {
    const user = getCurrentUser();
    const item = database.Transaction.find((tx) => tx.id === id);
    if (!item || (user?.role !== 'admin' && item.seller_id !== user?.id)) throw makeError('অনুমতি নেই', 403);
    item.status = status;
    item.updated_at = new Date().toISOString();
    addNotification(item.buyer_id, status === 'received' ? 'আপনার পেমেন্ট গ্রহণ করা হয়েছে' : 'পেমেন্টের অবস্থা পরিবর্তন হয়েছে', 'পেমেন্টের নতুন অবস্থা দেখুন।', 'payment', '/buyer-dashboard/transactions');
    saveDatabase();
    return clone(normalizeRecord(item));
  },
  async adminList(filters = {}) {
    const user = getCurrentUser();
    if (user?.role !== 'admin') throw makeError('অনুমতি নেই', 403);
    let items = [...(database.Transaction || [])];
    ['status', 'payment_method', 'buyer_id', 'seller_id'].forEach((field) => {
      if (filters[field]) items = items.filter((item) => item[field] === filters[field]);
    });
    if (filters.search) {
      const term = filters.search.toLowerCase();
      items = items.filter((item) => [item.transaction_code, item.transaction_reference, item.buyer_name, item.seller_name].some((v) => String(v || '').toLowerCase().includes(term)));
    }
    const page = Number(filters.page) || 1, limit = Number(filters.limit) || 20;
    return { items: clone(items.slice((page - 1) * limit, page * limit).map(normalizeRecord)), pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) } };
  },
  async adminSummary() {
    const items = database.Transaction || [];
    const paid = items.filter((item) => ['received', 'verified', 'completed'].includes(item.status));
    const pending = items.filter((item) => ['pending', 'sent'].includes(item.status));
    const methods = Object.entries(items.reduce((map, item) => ({ ...map, [item.payment_method || 'অনির্ধারিত']: (map[item.payment_method || 'অনির্ধারিত'] || 0) + 1 }), {})).map(([name, value]) => ({ name, value }));
    return {
      total_transactions: items.length,
      total_paid: paid.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      pending_amount: pending.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      cod_transactions: items.filter((item) => item.payment_method === 'cash_on_delivery').length,
      methods, months: []
    };
  }
};

export const localApi = {
  entities,
  transactions: transactionApi,
  bookings: {
    equipment: {
      my: () => entityClient('EquipmentBooking').filter({ farmer_id: getCurrentUser()?.id }, '-created_date'),
      create: (data) => entityClient('EquipmentBooking').create(data),
      update: (id, data) => entityClient('EquipmentBooking').update(id, data)
    },
    transport: {
      my: () => entityClient('TransportBooking').filter({ farmer_id: getCurrentUser()?.id }, '-created_date'),
      create: (data) => entityClient('TransportBooking').create(data),
      update: (id, data) => entityClient('TransportBooking').update(id, data)
    }
  },
  dashboard: {
    async farmerSummary() {
      const user = getCurrentUser();
      const orders = (database.Order || []).filter((item) => item.seller_id === user?.id);
      const bids = (database.Bid || []).filter((item) => item.farmer_id === user?.id);
      const tx = (database.Transaction || []).filter((item) => item.seller_id === user?.id || item.user_id === user?.id);
      const equipmentBookings = (database.EquipmentBooking || []).filter((item) => item.farmer_id === user?.id);
      const transportBookings = (database.TransportBooking || []).filter((item) => item.farmer_id === user?.id);
      return {
        summary: {
          active_listings: (database.CropListing || []).filter((item) => item.farmer_id === user?.id && item.status === 'active').length,
          total_orders: orders.length, pending_orders: orders.filter((item) => item.status === 'pending').length,
          revenue: tx.filter((item) => ['received', 'verified', 'completed'].includes(item.status)).reduce((sum, item) => sum + Number(item.amount || 0), 0),
          equipment_bookings: equipmentBookings.length,
          equipment_pending: equipmentBookings.filter((item) => item.status === 'pending').length,
          equipment_approved: equipmentBookings.filter((item) => ['approved', 'confirmed'].includes(item.status)).length,
          transport_requests: transportBookings.length,
          transport_pending: transportBookings.filter((item) => item.status === 'pending').length,
          transport_accepted: transportBookings.filter((item) => ['accepted', 'confirmed'].includes(item.status)).length
        },
        recentOrders: clone(orders.slice(0, 5)), recentBids: clone(bids.slice(0, 5)), months: []
      };
    },
    async adminSummary() {
      const users = database.User || [], listings = database.CropListing || [], orders = database.Order || [];
      const roleCounts = users.reduce((map, item) => ({ ...map, [item.role]: (map[item.role] || 0) + 1 }), {});
      const transactions = database.Transaction || [];
      return {
        users: users.length, listings: listings.length, orders: orders.length,
        bookings: (database.EquipmentBooking || []).length + (database.TransportBooking || []).length,
        transactions: transactions.length,
        revenue: transactions.filter((item) => ['received', 'verified', 'completed'].includes(item.status)).reduce((sum, item) => sum + Number(item.amount || 0), 0),
        pending: 0, sold_out: listings.filter((item) => ['sold', 'sold_out'].includes(item.status)).length,
        farmers: roleCounts.farmer || 0, buyers: roleCounts.buyer || 0, equipmentOwners: roleCounts.equipment_owner || 0,
        transportOwners: roleCounts.transport_provider || 0,
        roles: Object.entries(roleCounts).map(([name, value]) => ({ name, value })), months: []
      };
    }
  },
  availability: {
    async equipment(id, startDate, endDate) {
      const conflict = (database.EquipmentBooking || []).some((booking) =>
        booking.equipment_id === id
        && ['pending', 'approved', 'confirmed', 'active'].includes(booking.status)
        && booking.start_date <= endDate
        && booking.end_date >= startDate
      );
      return { available: !conflict };
    },
    async transport(id, pickupDate) {
      const conflict = (database.TransportBooking || []).some((booking) =>
        booking.vehicle_id === id
        && booking.pickup_date === pickupDate
        && ['pending', 'accepted', 'confirmed', 'in_transit'].includes(booking.status)
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
