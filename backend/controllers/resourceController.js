import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

function canCreate(config, user) {
  if (!user) return false;
  if (user.role === 'admin' && !config.strictCreateRoles) return true;
  if (config.adminOnlyWrite) return false;
  return !config.createRoles || config.createRoles.includes(user.role);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
}

async function validateCropListing(data, user) {
  const categories = new Set(['rice', 'vegetables', 'fruits', 'pulses', 'spices', 'fish', 'other']);
  if (!categories.has(data.category)) {
    return { error: 'Please select a valid crop category' };
  }
  if (!data.crop_name || Number(data.quantity) <= 0 || Number(data.expected_price) <= 0 || !data.district) {
    return { error: 'Crop name, quantity, price, and district are required' };
  }
  if (data.images !== undefined && !Array.isArray(data.images)) {
    return { error: 'Crop images must be a list of image URLs' };
  }
  const [users] = await pool.execute('SELECT full_name FROM users WHERE id = ? LIMIT 1', [user.id]);
  return {
    data: {
      ...data,
      expected_harvest_date: data.expected_harvest_date || null,
      location: data.location?.trim() || null,
      description: data.description?.trim() || null,
      farmer_name: users[0]?.full_name || 'Farmer'
    }
  };
}

async function canWriteRow(config, user, row) {
  if (!user || !row) return false;
  if (user.role === 'admin') return true;
  if (config.adminOnlyWrite) return false;
  if ((config.ownerFields || []).some((field) => row[field] === user.id)) return true;
  if (config.participantField && row[config.participantField]?.includes(user.id)) return true;
  if (config.conversationField) {
    const [rows] = await pool.execute(
      'SELECT id FROM conversations WHERE id = ? AND JSON_CONTAINS(participant_ids, JSON_QUOTE(?))',
      [row[config.conversationField], user.id]
    );
    return rows.length > 0;
  }
  return false;
}

async function createConversation(req, res) {
  const participantIds = [...new Set(Array.isArray(req.body.participant_ids) ? req.body.participant_ids : [])];
  if (participantIds.length !== 2 || !participantIds.includes(req.user.id)) {
    return res.status(400).json({ message: 'A conversation must include you and one other user' });
  }

  const placeholders = participantIds.map(() => '?').join(', ');
  const [users] = await pool.execute(
    `SELECT id, full_name, is_active FROM users WHERE id IN (${placeholders})`,
    participantIds
  );
  if (users.length !== 2 || users.some((user) => !user.is_active)) {
    return res.status(400).json({ message: 'A conversation participant is invalid' });
  }

  let listing;
  if (req.body.listing_id) {
    const [listings] = await pool.execute(
      'SELECT id, crop_name, district, farmer_id FROM crop_listings WHERE id = ? LIMIT 1',
      [req.body.listing_id]
    );
    listing = listings[0];
    if (!listing) return res.status(404).json({ message: 'Crop listing not found' });
    if (!participantIds.includes(listing.farmer_id)) {
      return res.status(400).json({ message: 'The listing farmer must be part of the conversation' });
    }
  }

  const [existing] = await pool.execute(
    `SELECT * FROM conversations
     WHERE listing_id <=> ?
       AND JSON_CONTAINS(participant_ids, JSON_QUOTE(?))
       AND JSON_CONTAINS(participant_ids, JSON_QUOTE(?))
     LIMIT 1`,
    [listing?.id || null, participantIds[0], participantIds[1]]
  );
  if (existing[0]) {
    const conversation = existing[0];
    conversation.participant_ids = parseJsonArray(conversation.participant_ids);
    conversation.participant_names = parseJsonArray(conversation.participant_names);
    return res.json(conversation);
  }

  const userById = new Map(users.map((user) => [user.id, user]));
  const id = crypto.randomUUID();
  const participantNames = participantIds.map((participantId) => userById.get(participantId).full_name || 'User');
  const subject = listing
    ? `${listing.crop_name} - ${listing.district}`
    : String(req.body.subject || 'Conversation').trim().slice(0, 255);

  await pool.execute(
    `INSERT INTO conversations
      (id, participant_ids, participant_names, subject, listing_id, listing_name, last_message, last_message_date)
     VALUES (?, ?, ?, ?, ?, ?, '', NOW())`,
    [
      id,
      JSON.stringify(participantIds),
      JSON.stringify(participantNames),
      subject,
      listing?.id || null,
      listing?.crop_name || null
    ]
  );
  const [created] = await pool.execute('SELECT * FROM conversations WHERE id = ?', [id]);
  const conversation = created[0];
  conversation.participant_ids = parseJsonArray(conversation.participant_ids);
  conversation.participant_names = parseJsonArray(conversation.participant_names);
  return res.status(201).json(conversation);
}

async function createMessage(req, res) {
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Message cannot be empty' });
  if (content.length > 5000) return res.status(400).json({ message: 'Message is too long' });

  const [conversations] = await pool.execute(
    'SELECT id, participant_ids FROM conversations WHERE id = ? LIMIT 1',
    [req.body.conversation_id]
  );
  const conversation = conversations[0];
  const participantIds = parseJsonArray(conversation?.participant_ids);
  if (!conversation || !participantIds.includes(req.user.id)) {
    return res.status(403).json({ message: 'You are not a participant in this conversation' });
  }
  const receiverId = participantIds.find((participantId) => participantId !== req.user.id);
  if (!receiverId) return res.status(400).json({ message: 'Conversation recipient is invalid' });

  const [senders] = await pool.execute('SELECT full_name FROM users WHERE id = ? LIMIT 1', [req.user.id]);
  const senderName = senders[0]?.full_name || 'User';
  const id = crypto.randomUUID();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, sender_name, content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, conversation.id, req.user.id, receiverId, senderName, content]
    );
    await connection.execute(
      `UPDATE conversations
       SET last_message = ?, last_message_by = ?, last_message_date = NOW()
       WHERE id = ?`,
      [content, req.user.id, conversation.id]
    );
    const [messages] = await connection.execute('SELECT * FROM messages WHERE id = ?', [id]);
    await connection.commit();
    return res.status(201).json(messages[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function createResourceController(model, config) {
  return {
    async list(req, res, next) {
      try {
        const { sort, limit, ...filters } = req.query;
        const data = await model.list({ filters, sort, limit, user: req.user });
        res.json(data);
      } catch (error) {
        next(error);
      }
    },

    async get(req, res, next) {
      try {
        const row = await model.findById(req.params.id, req.user);
        if (!row) return res.status(404).json({ message: 'Resource not found' });
        res.json(row);
      } catch (error) {
        next(error);
      }
    },

    async create(req, res, next) {
      try {
        if (!canCreate(config, req.user)) {
          return res.status(403).json({
            message: config.createDeniedMessage || 'You do not have permission to create this resource'
          });
        }
        if (config.route === 'conversations') return createConversation(req, res);
        if (config.route === 'messages') return createMessage(req, res);

        let data = { ...req.body };
        if (config.route === 'crop-listings') {
          const validation = await validateCropListing(data, req.user);
          if (validation.error) return res.status(400).json({ message: validation.error });
          data = validation.data;
        }
        if (config.userResource) {
          if (!data.email || !data.password) {
            return res.status(400).json({ message: 'Email and password are required' });
          }
          if (data.password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
          }
          data.email = data.email.trim().toLowerCase();
          data.password_hash = await bcrypt.hash(data.password, 12);
          delete data.password;
        }
        if (config.creatorField && req.user.role !== 'admin') data[config.creatorField] = req.user.id;
        if (config.participantField && !data[config.participantField]?.includes(req.user.id)) {
          return res.status(403).json({ message: 'You must be a participant in the conversation' });
        }
        if (config.conversationField) {
          const [conversations] = await pool.execute(
            'SELECT id FROM conversations WHERE id = ? AND JSON_CONTAINS(participant_ids, JSON_QUOTE(?))',
            [data[config.conversationField], req.user.id]
          );
          if (!conversations.length) {
            return res.status(403).json({ message: 'You must be a participant in the conversation' });
          }
        }
        const created = await model.create(data);
        res.status(201).json(created);
      } catch (error) {
        console.error('[resource.create] Create failed', {
          requestId: req.id,
          resource: config.route,
          userId: req.user?.id,
          role: req.user?.role,
          code: error.code,
          message: error.message
        });
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        const existing = await model.findById(req.params.id);
        if (!(await canWriteRow(config, req.user, existing))) {
          return res.status(403).json({ message: 'You do not have permission to update this resource' });
        }
        if (config.route === 'messages') {
          return res.status(405).json({ message: 'Sent messages cannot be edited' });
        }
        const changes = { ...req.body };
        if (config.route === 'conversations') {
          for (const field of ['participant_ids', 'participant_names', 'listing_id', 'last_message', 'last_message_by', 'last_message_date']) {
            delete changes[field];
          }
        }
        if (config.userResource && changes.password) {
          if (changes.password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
          }
          changes.password_hash = await bcrypt.hash(changes.password, 12);
          delete changes.password;
        }
        const updated = await model.update(req.params.id, changes);
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },

    async remove(req, res, next) {
      try {
        const existing = await model.findById(req.params.id);
        if (!(await canWriteRow(config, req.user, existing))) {
          return res.status(403).json({ message: 'You do not have permission to delete this resource' });
        }
        await model.remove(req.params.id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  };
}
