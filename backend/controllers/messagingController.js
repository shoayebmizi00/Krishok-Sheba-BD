import crypto from 'node:crypto';
import { pool } from '../config/db.js';
import { canStartRelatedConversation, isConversationParticipant } from '../services/messagingPolicy.js';

function parseParticipants(row) {
  if (Array.isArray(row?.participant_ids)) return row.participant_ids;
  try { return JSON.parse(row?.participant_ids || '[]'); } catch {
    return [row?.participant_one_id, row?.participant_two_id].filter(Boolean);
  }
}

function normalizeConversation(row) {
  return row && {
    ...row,
    participant_ids: parseParticipants(row),
    created_date: row.created_at,
    updated_date: row.updated_at
  };
}

function dashboardMessagePath(role, conversationId) {
  const base = role === 'farmer' ? '/farmer/messages'
    : role === 'buyer' ? '/buyer-dashboard/messages'
      : role === 'equipment_owner' ? '/equipment-owner-dashboard/messages'
        : role === 'transport_provider' ? '/transport-dashboard/messages'
          : '/admin/messages';
  return `${base}/${conversationId}`;
}

async function relationFor(type, id) {
  const queries = {
    listing: ['SELECT id, farmer_id FROM crop_listings WHERE id=? LIMIT 1', id],
    bid: ['SELECT id, buyer_id, farmer_id FROM bids WHERE id=? LIMIT 1', id],
    order: ['SELECT id, buyer_id, seller_id FROM orders WHERE id=? LIMIT 1', id],
    equipment_booking: ['SELECT id, farmer_id, owner_id FROM equipment_bookings WHERE id=? LIMIT 1', id],
    transport_booking: ['SELECT id, farmer_id, provider_id FROM transport_bookings WHERE id=? LIMIT 1', id]
  };
  if (!queries[type]) return null;
  const [rows] = await pool.execute(...queries[type]);
  return rows[0] || null;
}

async function findConversation(id) {
  const [rows] = await pool.execute('SELECT * FROM conversations WHERE id=? LIMIT 1', [id]);
  return normalizeConversation(rows[0]);
}

export async function listConversations(req, res, next) {
  try {
    const scope = req.user.role === 'admin'
      ? ''
      : 'WHERE c.participant_one_id=? OR c.participant_two_id=? OR JSON_CONTAINS(c.participant_ids, JSON_QUOTE(?))';
    const values = req.user.role === 'admin' ? [] : [req.user.id, req.user.id, req.user.id];
    const [rows] = await pool.execute(
      `SELECT c.*,
        CASE WHEN c.participant_one_id=? THEN u2.full_name ELSE u1.full_name END other_name,
        CASE WHEN c.participant_one_id=? THEN u2.role ELSE u1.role END other_role,
        SUM(CASE WHEN m.receiver_id=? AND m.is_read=FALSE THEN 1 ELSE 0 END) unread_count
       FROM conversations c
       LEFT JOIN users u1 ON u1.id=c.participant_one_id
       LEFT JOIN users u2 ON u2.id=c.participant_two_id
       LEFT JOIN messages m ON m.conversation_id=c.id
       ${scope}
       GROUP BY c.id ORDER BY COALESCE(c.last_message_at,c.last_message_date,c.updated_at) DESC LIMIT 100`,
      [req.user.id, req.user.id, req.user.id, ...values]
    );
    res.json(rows.map(normalizeConversation));
  } catch (error) { next(error); }
}

export async function createConversation(req, res, next) {
  try {
    const receiverId = req.body.receiver_id
      || (req.body.participant_ids || []).find((id) => id !== req.user.id);
    const relatedType = req.body.related_type || (req.body.listing_id ? 'listing' : null);
    const relatedId = req.body.related_id || req.body.listing_id || null;
    if (!receiverId) return res.status(400).json({ message: 'বার্তা প্রাপকের তথ্য দিন' });
    const [userRows] = await pool.execute('SELECT id,full_name,role,is_active FROM users WHERE id IN (?,?)', [req.user.id, receiverId]);
    const currentUser = userRows.find((item) => item.id === req.user.id);
    const receiver = userRows.find((item) => item.id === receiverId);
    const relation = relatedType === 'user' ? null : await relationFor(relatedType, relatedId);
    if (!canStartRelatedConversation({ user: currentUser || req.user, receiver, relatedType, relation })) {
      return res.status(403).json({ message: 'এই ব্যবহারকারীর সঙ্গে কথোপকথন শুরু করার অনুমতি নেই' });
    }
    const [existing] = await pool.execute(
      `SELECT * FROM conversations WHERE
       ((participant_one_id=? AND participant_two_id=?) OR (participant_one_id=? AND participant_two_id=?)
        OR (JSON_CONTAINS(participant_ids,JSON_QUOTE(?)) AND JSON_CONTAINS(participant_ids,JSON_QUOTE(?))))
       AND related_type <=> ? AND related_id <=> ? LIMIT 1`,
      [req.user.id, receiverId, receiverId, req.user.id, req.user.id, receiverId, relatedType, relatedId]
    );
    if (existing[0]) return res.json(normalizeConversation(existing[0]));

    const id = crypto.randomUUID();
    const names = [currentUser?.full_name || 'ব্যবহারকারী', receiver.full_name || 'ব্যবহারকারী'];
    const subject = String(req.body.subject || `${names[0]} ও ${names[1]}`).slice(0, 255);
    await pool.execute(
      `INSERT INTO conversations
       (id,participant_one_id,participant_two_id,participant_ids,participant_names,subject,listing_id,
        listing_name,related_type,related_id,last_message,last_message_date,last_message_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,'',NOW(),NOW())`,
      [
        id, req.user.id, receiverId, JSON.stringify([req.user.id, receiverId]), JSON.stringify(names),
        subject, relatedType === 'listing' ? relatedId : null, req.body.listing_name || null, relatedType, relatedId
      ]
    );
    res.status(201).json(await findConversation(id));
  } catch (error) { next(error); }
}

export async function getConversationMessages(req, res, next) {
  try {
    const conversation = await findConversation(req.params.id);
    if (!conversation || !isConversationParticipant(conversation, req.user.id, req.user.role)) {
      return res.status(404).json({ message: 'কথোপকথন পাওয়া যায়নি' });
    }
    const [messages] = await pool.execute(
      'SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC LIMIT 500',
      [conversation.id]
    );
    res.json({ conversation, messages: messages.map((item) => ({ ...item, message_text: item.message_text || item.content, created_date: item.created_at })) });
  } catch (error) { next(error); }
}

export async function sendMessage(req, res, next) {
  const text = String(req.body.message_text || req.body.content || '').trim();
  if (!text) return res.status(400).json({ message: 'বার্তা লিখুন' });
  if (text.length > 5000) return res.status(400).json({ message: 'বার্তাটি খুব বড়' });
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [rows] = await db.execute('SELECT * FROM conversations WHERE id=? FOR UPDATE', [req.body.conversation_id]);
    const conversation = normalizeConversation(rows[0]);
    if (!conversation || !isConversationParticipant(conversation, req.user.id, req.user.role)) {
      await db.rollback();
      return res.status(403).json({ message: 'এই কথোপকথনে বার্তা পাঠানোর অনুমতি নেই' });
    }
    const receiverId = conversation.participant_ids.find((id) => id !== req.user.id);
    const [senders] = await db.execute('SELECT full_name FROM users WHERE id=? LIMIT 1', [req.user.id]);
    const senderName = senders[0]?.full_name || 'ব্যবহারকারী';
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO messages (id,conversation_id,sender_id,receiver_id,sender_name,content,message_text,is_read)
       VALUES (?,?,?,?,?,?,?,FALSE)`,
      [id, conversation.id, req.user.id, receiverId, senderName, text, text]
    );
    await db.execute(
      `UPDATE conversations SET last_message=?,last_message_by=?,last_message_date=NOW(),last_message_at=NOW()
       WHERE id=?`,
      [text, req.user.id, conversation.id]
    );
    const [receiverRows] = await db.execute('SELECT role FROM users WHERE id=? LIMIT 1', [receiverId]);
    await db.execute(
      `INSERT INTO notifications (id,user_id,title,message,type,is_read,link)
       VALUES (?,?,? ,?,'message',FALSE,?)`,
      [crypto.randomUUID(), receiverId, 'নতুন বার্তা পেয়েছেন', `${senderName} আপনাকে একটি নতুন বার্তা পাঠিয়েছেন।`, dashboardMessagePath(receiverRows[0]?.role, conversation.id)]
    );
    const [created] = await db.execute('SELECT * FROM messages WHERE id=?', [id]);
    await db.commit();
    res.status(201).json({ ...created[0], message_text: created[0].message_text || created[0].content, created_date: created[0].created_at });
  } catch (error) {
    await db.rollback();
    next(error);
  } finally { db.release(); }
}

export async function markMessageRead(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM messages WHERE id=? LIMIT 1', [req.params.id]);
    if (!rows[0] || (req.user.role !== 'admin' && rows[0].receiver_id !== req.user.id)) {
      return res.status(403).json({ message: 'এই বার্তা পরিবর্তনের অনুমতি নেই' });
    }
    await pool.execute('UPDATE messages SET is_read=TRUE WHERE id=?', [req.params.id]);
    res.json({ ...rows[0], is_read: true });
  } catch (error) { next(error); }
}

export async function markConversationRead(req, res, next) {
  try {
    const conversation = await findConversation(req.params.id);
    if (!conversation || !isConversationParticipant(conversation, req.user.id, req.user.role)) {
      return res.status(404).json({ message: 'কথোপকথন পাওয়া যায়নি' });
    }
    await pool.execute('UPDATE messages SET is_read=TRUE WHERE conversation_id=? AND receiver_id=?', [conversation.id, req.user.id]);
    res.json({ success: true });
  } catch (error) { next(error); }
}
