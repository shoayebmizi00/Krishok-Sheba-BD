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
          farmer_name: currentUser.full_name || 'Farmer'
        };
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
      const created = {
        ...clone(data),
        id: `${name.toLowerCase()}-${crypto.randomUUID()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      database[name] = [created, ...(database[name] || [])];
      if (name === 'Message') {
        const conversation = database.Conversation.find((item) => item.id === created.conversation_id);
        if (conversation) {
          conversation.last_message = created.content;
          conversation.last_message_by = created.sender_id;
          conversation.last_message_date = created.created_at;
          conversation.updated_at = created.created_at;
        }
      }
      saveDatabase();
      return clone(normalizeRecord(created));
    },
    async update(id, data) {
      const index = (database[name] || []).findIndex((record) => record.id === id);
      if (index < 0) throw makeError(`${name} not found`, 404);
      database[name][index] = {
        ...database[name][index],
        ...clone(data),
        updated_at: new Date().toISOString()
      };
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
