import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { validateOrderCreation } from '../services/orderPolicy.js';

async function createNotification(connection, { userId, title, message, type = 'system', link = null }) {
  if (!userId) return;
  await connection.execute(
    `INSERT INTO notifications (id, user_id, title, message, type, is_read, link)
     VALUES ($1, $2, $3, $4, $5, FALSE, $6) RETURNING id`,
    [crypto.randomUUID(), userId, title, message, type, link]
  );
}

async function notifyAfterCreate(config, data) {
  const payloads = [];
  if (config.route === 'bids') {
    payloads.push({ userId: data.farmer_id, title: 'নতুন বিড এসেছে', message: `${data.crop_name || 'আপনার ফসল'}-এর জন্য নতুন বিড এসেছে।`, type: 'bid', link: '/farmer-dashboard/bids' });
  } else if (config.route === 'orders') {
    payloads.push({ userId: data.seller_id, title: 'নতুন অর্ডার', message: `${data.buyer_name || 'একজন ক্রেতা'} নতুন অর্ডার নিশ্চিত করেছেন।`, type: 'order', link: '/farmer-dashboard/orders' });
  } else if (config.route === 'equipment-bookings') {
    payloads.push({ userId: data.owner_id, title: 'নতুন যন্ত্রপাতি বুকিং', message: `${data.equipment_name || 'যন্ত্রপাতি'} বুকিংয়ের অনুরোধ এসেছে।`, type: 'booking', link: '/equipment-owner-dashboard/bookings' });
  } else if (config.route === 'transport-bookings') {
    payloads.push({ userId: data.provider_id, title: 'নতুন পরিবহন বুকিং', message: 'একটি নতুন পরিবহন বুকিং অনুরোধ এসেছে।', type: 'booking', link: '/transport-dashboard/bookings' });
  } else if (config.route === 'transactions') {
    payloads.push({ userId: data.seller_id, title: 'নতুন পেমেন্ট রেকর্ড', message: `${data.amount || 0} টাকার একটি লেনদেন রেকর্ড তৈরি হয়েছে।`, type: 'payment', link: '/farmer-dashboard/transactions' });
  } else if (config.route === 'government-notices') {
    const [users] = await pool.execute('SELECT id FROM users WHERE is_active = TRUE');
    payloads.push(...users.map((user) => ({ userId: user.id, title: 'নতুন সরকারি নোটিশ', message: data.title, type: 'notice', link: '/notices' })));
  }
  await Promise.all(payloads.map((payload) => createNotification(pool, payload)));
}

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
  if (!data.category || String(data.category).length > 100) {
    return { error: 'সঠিক ফসলের বিভাগ নির্বাচন করুন' };
  }
  if (!data.crop_name || Number(data.quantity) <= 0 || Number(data.expected_price) <= 0 || !data.district) {
    return { error: 'ফসলের নাম, পরিমাণ, মূল্য ও জেলা আবশ্যক' };
  }
  if (data.listing_type === 'pre_harvest' && !data.expected_harvest_date) {
    return { error: 'আগাম ফসলের জন্য সম্ভাব্য ফসল কাটার তারিখ আবশ্যক' };
  }
  if (data.images !== undefined && !Array.isArray(data.images)) {
    return { error: 'ফসলের ছবিগুলো সঠিকভাবে দিন' };
  }
  const [users] = await pool.execute('SELECT full_name FROM users WHERE id = $1 LIMIT 1', [user.id]);
  return {
    data: {
      ...data,
      total_quantity: Number(data.total_quantity || data.quantity),
      sold_quantity: Number(data.sold_quantity || 0),
      remaining_quantity: Number(data.remaining_quantity ?? data.quantity),
      expected_harvest_date: data.listing_type === 'pre_harvest' ? data.expected_harvest_date : null,
      location: data.location?.trim() || null,
      description: data.description?.trim() || null,
      farmer_name: users[0]?.full_name || 'কৃষক'
    }
  };
}

async function createOrder(req, res) {
  const bidId = req.body.bid_id;
  const quantity = Number(req.body.quantity ?? req.body.items?.[0]?.quantity);
  if (!bidId || !Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'সঠিক বিড ও অর্ডারের পরিমাণ দিন' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute(
      'SELECT id, full_name, role, is_active FROM users WHERE id = $1 LIMIT 1 FOR UPDATE',
      [req.user.id]
    );
    const currentUser = users[0];
    if (!currentUser?.is_active) {
      await connection.rollback();
      return res.status(403).json({ message: 'আপনার এই অর্ডার তৈরি করার অনুমতি নেই' });
    }
    const [bids] = await connection.execute(
      `SELECT bid.*, listing.unit, listing.expected_price, listing.remaining_quantity,
              listing.status AS listing_status, listing.farmer_name, listing.id AS crop_listing_id
       FROM bids AS bid
       JOIN crop_listings AS listing ON listing.id = bid.listing_id
       WHERE bid.id = $1 FOR UPDATE`,
      [bidId]
    );
    const bid = bids[0];
    const listing = bid ? {
      id: bid.crop_listing_id,
      status: bid.listing_status,
      remaining_quantity: bid.remaining_quantity
    } : null;
    const validation = validateOrderCreation({
      user: currentUser,
      bid,
      listing,
      quantity,
      cropListingId: req.body.crop_listing_id
    });
    if (validation) {
      await connection.rollback();
      return res.status(validation.status).json({ message: validation.message });
    }
    const [existing] = await connection.execute('SELECT id FROM orders WHERE bid_id = $1 LIMIT 1', [bidId]);
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ message: 'এই বিড থেকে ইতিমধ্যে অর্ডার তৈরি হয়েছে' });
    }

    const remaining = Number(bid.remaining_quantity) - quantity;
    const totalAmount = quantity * Number(bid.bid_amount);
    const orderId = crypto.randomUUID();
    const items = [{
      listing_id: bid.listing_id,
      name: bid.crop_name,
      quantity,
      unit: bid.unit,
      price: Number(bid.bid_amount)
    }];
    await connection.execute(
      `INSERT INTO orders
        (id, buyer_id, buyer_name, seller_id, seller_name, items, total_amount, status,
         delivery_address, delivery_district, payment_status, bid_id, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, 'pending', $10, $11) RETURNING id`,
      [
        orderId, currentUser.id, currentUser.full_name || 'ক্রেতা', bid.farmer_id,
        bid.farmer_name || 'কৃষক', JSON.stringify(items), totalAmount,
        req.body.delivery_location || req.body.delivery_address,
        req.body.district || req.body.delivery_district,
        bidId, req.body.payment_method
      ]
    );
    await connection.execute(
      `UPDATE crop_listings
       SET sold_quantity = sold_quantity + $1,
           remaining_quantity = $2,
           status = CASE WHEN $3 <= 0 THEN 'sold_out' ELSE 'active' END
       WHERE id = $4`,
      [quantity, remaining, remaining, bid.listing_id]
    );
    await createNotification(connection, {
      userId: bid.farmer_id,
      title: 'নতুন অর্ডার পাওয়া গেছে',
      message: `${bid.crop_name}-এর ${quantity} ${bid.unit} অর্ডার হয়েছে।`,
      type: 'order',
      link: '/farmer-dashboard/orders'
    });
    await createNotification(connection, {
      userId: currentUser.id,
      title: 'অর্ডার সফলভাবে তৈরি হয়েছে',
      message: `${bid.crop_name}-এর অর্ডার সফলভাবে তৈরি হয়েছে।`,
      type: 'order',
      link: '/buyer-dashboard/orders'
    });
    const [orders] = await connection.execute('SELECT * FROM orders WHERE id = $1', [orderId]);
    await connection.commit();
    orders[0].items = parseJsonArray(orders[0].items);
    return res.status(201).json(orders[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createEquipmentBooking(req, res) {
  const { equipment_id, start_date, end_date } = req.body;
  if (!equipment_id || !start_date || !end_date || end_date < start_date) {
    return res.status(400).json({ message: 'সঠিক বুকিং তারিখ দিন' });
  }
  const [conflicts] = await pool.execute(
    `SELECT id FROM equipment_bookings
     WHERE equipment_id = $1 AND status IN ('pending','approved','confirmed','active')
       AND start_date <= $2 AND end_date >= $3 LIMIT 1`,
    [equipment_id, end_date, start_date]
  );
  if (conflicts.length) return res.status(409).json({ message: 'নির্বাচিত তারিখে যন্ত্রপাতিটি উপলব্ধ নয়' });
  return null;
}

async function createTransportBooking(req, res) {
  const { vehicle_id, pickup_date } = req.body;
  if (!vehicle_id || !pickup_date) return res.status(400).json({ message: 'পিকআপের তারিখ দিন' });
  const [conflicts] = await pool.execute(
    `SELECT id FROM transport_bookings
     WHERE vehicle_id = $1 AND pickup_date = $2
       AND status IN ('pending','accepted','confirmed','in_transit') LIMIT 1`,
    [vehicle_id, pickup_date]
  );
  if (conflicts.length) return res.status(409).json({ message: 'নির্বাচিত তারিখে যানবাহনটি উপলব্ধ নয়' });
  return null;
}

async function canWriteRow(config, user, row) {
  if (!user || !row) return false;
  if (user.role === 'admin') return true;
  if (config.adminOnlyWrite) return false;
  if ((config.ownerFields || []).some((field) => row[field] === user.id)) return true;
  if (config.participantField && row[config.participantField]?.includes(user.id)) return true;
  if (config.conversationField) {
    const [rows] = await pool.execute(
      'SELECT id FROM conversations WHERE id = $1 AND participant_ids @> jsonb_build_array($2::text)',
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

  const placeholders = participantIds.map((_, index) => `$${index + 1}`).join(', ');
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
      'SELECT id, crop_name, district, farmer_id FROM crop_listings WHERE id = $1 LIMIT 1',
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
     WHERE listing_id IS NOT DISTINCT FROM $1
       AND participant_ids @> jsonb_build_array($2::text)
       AND participant_ids @> jsonb_build_array($3::text)
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
     VALUES ($1, $2, $3, $4, $5, $6, '', NOW()) RETURNING id`,
    [
      id,
      JSON.stringify(participantIds),
      JSON.stringify(participantNames),
      subject,
      listing?.id || null,
      listing?.crop_name || null
    ]
  );
  const [created] = await pool.execute('SELECT * FROM conversations WHERE id = $1', [id]);
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
    'SELECT id, participant_ids FROM conversations WHERE id = $1 LIMIT 1',
    [req.body.conversation_id]
  );
  const conversation = conversations[0];
  const participantIds = parseJsonArray(conversation?.participant_ids);
  if (!conversation || !participantIds.includes(req.user.id)) {
    return res.status(403).json({ message: 'You are not a participant in this conversation' });
  }
  const receiverId = participantIds.find((participantId) => participantId !== req.user.id);
  if (!receiverId) return res.status(400).json({ message: 'Conversation recipient is invalid' });

  const [senders] = await pool.execute('SELECT full_name FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
  const senderName = senders[0]?.full_name || 'User';
  const id = crypto.randomUUID();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, sender_name, content)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [id, conversation.id, req.user.id, receiverId, senderName, content]
    );
    await connection.execute(
      `UPDATE conversations
       SET last_message = $1, last_message_by = $2, last_message_date = NOW()
       WHERE id = $3`,
      [content, req.user.id, conversation.id]
    );
    await createNotification(connection, {
      userId: receiverId,
      title: 'নতুন বার্তা',
      message: `${senderName} আপনাকে একটি বার্তা পাঠিয়েছেন।`,
      type: 'message',
      link: `/messages/${conversation.id}`
    });
    const [messages] = await connection.execute('SELECT * FROM messages WHERE id = $1', [id]);
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
        const { sort, limit, page, ...filters } = req.query;
        if (config.route === 'crop-listings' && req.user?.role !== 'admin' && !filters.farmer_id) {
          filters.status = filters.status || 'active';
        }
        if (config.route === 'equipment' && req.user?.role !== 'admin' && !filters.owner_id) {
          filters.approval_status = 'approved';
        }
        if (config.route === 'vehicles' && req.user?.role !== 'admin' && !filters.owner_id) {
          filters.approval_status = 'approved';
        }
        if (
          config.route === 'stories'
          && req.user?.role !== 'admin'
          && !(filters.author_id && filters.author_id === req.user?.id)
        ) {
          filters.status = 'approved';
        }
        const data = await model.list({ filters, sort, limit, page, user: req.user });
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
        if (config.route === 'orders') return createOrder(req, res);
        if (!canCreate(config, req.user)) {
          return res.status(403).json({
            message: config.createDeniedMessage || 'আপনার এই কাজ করার অনুমতি নেই'
          });
        }
        if (config.route === 'conversations') return createConversation(req, res);
        if (config.route === 'messages') return createMessage(req, res);

        let data = { ...req.body };
        if (config.route === 'equipment-bookings') {
          const conflictResponse = await createEquipmentBooking(req, res);
          if (conflictResponse) return conflictResponse;
        }
        if (config.route === 'transport-bookings') {
          const conflictResponse = await createTransportBooking(req, res);
          if (conflictResponse) return conflictResponse;
        }
        if (config.route === 'crop-listings') {
          const validation = await validateCropListing(data, req.user);
          if (validation.error) return res.status(400).json({ message: validation.error });
          data = { ...validation.data, status: data.status || 'active' };
        }
        if (config.route === 'equipment') {
          data.approval_status = data.approval_status || 'approved';
        }
        if (config.route === 'vehicles') {
          data.approval_status = data.approval_status || 'approved';
        }
        if (config.route === 'bids') {
          const [listings] = await pool.execute(
            'SELECT remaining_quantity, unit, status FROM crop_listings WHERE id = $1 LIMIT 1',
            [data.listing_id]
          );
          const listing = listings[0];
          const requested = Number(data.quantity_requested || 0);
          if (!listing || ['sold', 'sold_out'].includes(listing.status) || Number(listing.remaining_quantity) <= 0) {
            return res.status(409).json({ message: 'এই ফসলটি বিক্রি শেষ' });
          }
          if (requested <= 0 || requested > Number(listing.remaining_quantity)) {
            return res.status(400).json({ message: `সর্বোচ্চ ${listing.remaining_quantity} ${listing.unit} বিড করা যাবে` });
          }
        }
        if (config.route === 'stories') {
          data.status = req.user.role === 'admin' ? (data.status || 'approved') : 'pending';
          const [authors] = await pool.execute('SELECT full_name, district FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
          data.author_name = authors[0]?.full_name || 'ব্যবহারকারী';
          data.district = data.district || authors[0]?.district;
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
            'SELECT id FROM conversations WHERE id = $1 AND participant_ids @> jsonb_build_array($2::text)',
            [data[config.conversationField], req.user.id]
          );
          if (!conversations.length) {
            return res.status(403).json({ message: 'You must be a participant in the conversation' });
          }
        }
        const created = await model.create(data);
        await notifyAfterCreate(config, data);
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
        if (config.route === 'bids' && ['accepted', 'rejected'].includes(changes.status)) {
          await createNotification(pool, {
            userId: existing.buyer_id,
            title: changes.status === 'accepted' ? 'বিড গ্রহণ করা হয়েছে' : 'বিড প্রত্যাখ্যান করা হয়েছে',
            message: `${existing.crop_name || 'ফসল'}-এর বিড ${changes.status === 'accepted' ? 'গ্রহণ' : 'প্রত্যাখ্যান'} করা হয়েছে।`,
            type: 'bid',
            link: '/buyer-dashboard/orders'
          });
        }
        if (config.userResource && Object.hasOwn(changes, 'is_active') && existing.is_active !== changes.is_active) {
          await createNotification(pool, {
            userId: existing.id,
            title: changes.is_active ? 'অ্যাকাউন্ট সক্রিয় করা হয়েছে' : 'অ্যাকাউন্ট সাময়িকভাবে স্থগিত',
            message: changes.is_active
              ? 'প্রশাসক আপনার অ্যাকাউন্ট সক্রিয় করেছেন।'
              : 'প্রশাসক আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করেছেন।',
            type: 'system',
            link: changes.is_active ? '/profile' : '/login'
          });
        }
        if (config.route === 'transactions' && changes.status && changes.status !== existing.status) {
          const recipientId = changes.status === 'verified' ? existing.buyer_id : existing.seller_id;
          await createNotification(pool, {
            userId: recipientId,
            title: changes.status === 'verified' ? 'পেমেন্ট যাচাই হয়েছে' : 'লেনদেনের অবস্থা পরিবর্তন হয়েছে',
            message: `${existing.amount || 0} টাকার লেনদেনটি এখন ${changes.status} অবস্থায় আছে।`,
            type: 'payment',
            link: recipientId === existing.buyer_id ? '/buyer-dashboard/transactions' : '/farmer-dashboard/transactions'
          });
        }
        if (['equipment-bookings', 'transport-bookings'].includes(config.route) && changes.status && changes.status !== existing.status) {
          const userId = existing.farmer_id;
          await createNotification(pool, {
            userId,
            title: 'বুকিংয়ের অবস্থা পরিবর্তন হয়েছে',
            message: `আপনার বুকিংটি এখন ${changes.status} অবস্থায় আছে।`,
            type: 'booking',
            link: config.route === 'equipment-bookings'
              ? '/farmer-dashboard/equipment-bookings'
              : '/farmer-dashboard/transport-requests'
          });
        }
        if (config.route === 'government-notices' && changes.is_active === true && !existing.is_active) {
          const [users] = await pool.execute('SELECT id FROM users WHERE is_active = TRUE');
          await Promise.all(users.map((user) => createNotification(pool, {
            userId: user.id,
            title: 'নতুন সরকারি নোটিশ',
            message: changes.title || existing.title,
            type: 'notice',
            link: '/notices'
          })));
        }
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
