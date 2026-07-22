import crypto from 'node:crypto';
import { pool } from '../config/db.js';

const METHODS = new Set(['cash_on_delivery', 'bkash', 'nagad', 'rocket', 'upay', 'bank_transfer', 'visa', 'mastercard', 'amex', 'cash']);
const STATUSES = new Set(['pending', 'sent', 'received', 'verified', 'failed', 'cancelled', 'cod_pending']);
const detailSql = `SELECT t.*, o.buyer_name, o.seller_name, o.items, o.total_amount AS order_total,
  o.status AS delivery_status, o.payment_status, buyer.full_name AS buyer_full_name,
  seller.full_name AS seller_full_name FROM transactions t
  LEFT JOIN orders o ON o.id=t.order_id LEFT JOIN users buyer ON buyer.id=t.buyer_id
  LEFT JOIN users seller ON seller.id=t.seller_id`;

const parseItems = (value) => {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || '[]'); } catch { return []; }
};
const normalize = (row) => row && ({ ...row, items: parseItems(row.items), created_date: row.created_at, updated_date: row.updated_at });
const paging = (query) => {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  return { limit, page, offset: (page - 1) * limit };
};
async function notify(db, userId, title, message, link) {
  await db.execute(`INSERT INTO notifications (id,user_id,title,message,type,is_read,link)
    VALUES ($1,$2,$3,$4, 'payment',FALSE,$5)`, [crypto.randomUUID(), userId, title, message, link]);
}

export async function paymentContext(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT o.*,u.bkash_number,u.nagad_number,u.rocket_number,u.upay_number,
      u.bank_name,u.bank_account_number,u.account_holder_name,u.branch_name FROM orders o
      JOIN users u ON u.id=o.seller_id WHERE o.id=$1 AND (o.buyer_id=$2 OR $3='admin') LIMIT 1`,
    [req.params.orderId, req.user.id, req.user.role]);
    if (!rows[0]) return res.status(404).json({ message: 'অর্ডার পাওয়া যায়নি' });
    return res.json(normalize(rows[0]));
  } catch (error) { return next(error); }
}

export async function createTransaction(req, res, next) {
  const body = req.body;
  if (req.user.role !== 'buyer') return res.status(403).json({ message: 'শুধু ক্রেতা পেমেন্ট তথ্য পাঠাতে পারবেন' });
  if (!body.order_id || !METHODS.has(body.payment_method) || Number(body.amount) <= 0) {
    return res.status(400).json({ message: 'অর্ডার, পেমেন্ট পদ্ধতি ও সঠিক পরিমাণ দিন' });
  }
  if (['bkash', 'nagad', 'rocket', 'upay'].includes(body.payment_method) && (!body.sender_number || !body.transaction_reference)) {
    return res.status(400).json({ message: 'প্রেরক মোবাইল নম্বর ও ট্রানজেকশন আইডি দিন' });
  }
  if (body.payment_method === 'bank_transfer' && (!body.sender_bank || !body.transaction_reference)) {
    return res.status(400).json({ message: 'ব্যাংকের নাম ও ট্রানজেকশন রেফারেন্স দিন' });
  }
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [orders] = await db.execute(`SELECT o.*,u.bkash_number,u.nagad_number,u.rocket_number,u.upay_number,
      u.bank_account_number,u.bank_name FROM orders o JOIN users u ON u.id=o.seller_id
      WHERE o.id=$1 AND o.buyer_id=$2 FOR UPDATE`, [body.order_id, req.user.id]);
    const order = orders[0];
    if (!order) {
      await db.rollback();
      return res.status(403).json({ message: 'এই অর্ডারের জন্য পেমেন্ট পাঠানোর অনুমতি নেই' });
    }
    const receiverNumber = order[`${body.payment_method}_number`] || null;
    const receiverAccount = body.payment_method === 'bank_transfer' ? order.bank_account_number : receiverNumber;
    const id = crypto.randomUUID();
    const code = `KSB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const status = body.payment_method === 'cash_on_delivery' ? 'cod_pending' : 'sent';
    await db.execute(`INSERT INTO transactions
      (id,transaction_code,user_id,order_id,buyer_id,seller_id,amount,type,status,description,counterparty_name,
       payment_method,sender_account,receiver_account,reference,sender_number,receiver_number,sender_bank,
       receiver_bank,transaction_reference,screenshot_url,note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'purchase',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`, [
      id, code, req.user.id, order.id, req.user.id, order.seller_id, Number(body.amount), status,
      `${parseItems(order.items)[0]?.name || 'অর্ডার'} পেমেন্ট`, order.seller_name, body.payment_method,
      body.sender_number || body.account_number || null, receiverAccount, body.transaction_reference || null,
      body.sender_number || null, receiverNumber, body.sender_bank || null,
      body.payment_method === 'bank_transfer' ? order.bank_name : null, body.transaction_reference || null,
      body.screenshot_url || null, String(body.note || '').slice(0, 1000) || null
    ]);
    await notify(db, order.seller_id, 'নতুন পেমেন্ট তথ্য পাওয়া গেছে',
      `${order.buyer_name || 'একজন ক্রেতা'} ${Number(body.amount).toLocaleString('bn-BD')} টাকার পেমেন্ট তথ্য পাঠিয়েছেন।`,
      '/farmer-dashboard/transactions');
    const [created] = await db.execute(`${detailSql} WHERE t.id=$1`, [id]);
    await db.commit();
    return res.status(201).json(normalize(created[0]));
  } catch (error) {
    await db.rollback();
    return next(error);
  } finally { db.release(); }
}

async function listFor(req, res, next, field) {
  try {
    const { limit, page, offset } = paging(req.query);
    const [rows] = await pool.execute(`${detailSql} WHERE t.${field}=$1 ORDER BY t.created_at DESC LIMIT ${limit} OFFSET ${offset}`, [req.user.id]);
    const [[count]] = await pool.execute(`SELECT COUNT(*) total FROM transactions WHERE ${field}=$1`, [req.user.id]);
    return res.json({ items: rows.map(normalize), pagination: { page, limit, total: Number(count.total), pages: Math.ceil(count.total / limit) } });
  } catch (error) { return next(error); }
}
export const mySent = (req, res, next) => listFor(req, res, next, 'buyer_id');
export const myReceived = (req, res, next) => listFor(req, res, next, 'seller_id');

export async function getTransaction(req, res, next) {
  try {
    const [rows] = await pool.execute(`${detailSql} WHERE t.id=$1 LIMIT 1`, [req.params.id]);
    const row = rows[0];
    if (!row || (req.user.role !== 'admin' && ![row.buyer_id, row.seller_id].includes(req.user.id))) {
      return res.status(404).json({ message: 'লেনদেন পাওয়া যায়নি' });
    }
    return res.json(normalize(row));
  } catch (error) { return next(error); }
}

export async function updateStatus(req, res, next) {
  const status = req.body.status;
  if (!STATUSES.has(status)) return res.status(400).json({ message: 'সঠিক অবস্থা নির্বাচন করুন' });
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [rows] = await db.execute('SELECT * FROM transactions WHERE id=$1 FOR UPDATE', [req.params.id]);
    const tx = rows[0];
    if (!tx) return res.status(404).json({ message: 'লেনদেন পাওয়া যায়নি' });
    const allowed = req.user.role === 'admin' || (tx.seller_id === req.user.id && ['received', 'failed', 'cancelled'].includes(status));
    if (!allowed) return res.status(403).json({ message: 'এই অবস্থা পরিবর্তনের অনুমতি নেই' });
    await db.execute('UPDATE transactions SET status=$1 WHERE id=$2', [status, tx.id]);
    if (['received', 'verified'].includes(status)) await db.execute("UPDATE orders SET payment_status='paid' WHERE id=$1", [tx.order_id]);
    const title = status === 'verified' ? 'আপনার পেমেন্ট যাচাই করা হয়েছে' : status === 'received' ? 'আপনার পেমেন্ট গ্রহণ করা হয়েছে' : 'পেমেন্টের অবস্থা পরিবর্তন হয়েছে';
    await notify(db, tx.buyer_id, title, `${Number(tx.amount).toLocaleString('bn-BD')} টাকার লেনদেনের অবস্থা পরিবর্তন হয়েছে।`, '/buyer-dashboard/transactions');
    if (status === 'verified') await notify(db, tx.seller_id, 'পেমেন্ট যাচাই করা হয়েছে', 'প্রশাসক পেমেন্টটি যাচাই করেছেন।', '/farmer-dashboard/transactions');
    const [updated] = await db.execute(`${detailSql} WHERE t.id=$1`, [tx.id]);
    await db.commit();
    return res.json(normalize(updated[0]));
  } catch (error) {
    await db.rollback();
    return next(error);
  } finally { db.release(); }
}

export async function adminList(req, res, next) {
  try {
    const { limit, page, offset } = paging(req.query);
    const clauses = [], values = [];
    ['status', 'payment_method', 'buyer_id', 'seller_id'].forEach((field) => {
      if (req.query[field]) { values.push(req.query[field]); clauses.push(`t.${field}=$${values.length}`); }
    });
    if (req.query.date_from) { values.push(req.query.date_from); clauses.push(`DATE(t.created_at)>=$${values.length}`); }
    if (req.query.date_to) { values.push(req.query.date_to); clauses.push(`DATE(t.created_at)<=$${values.length}`); }
    if (req.query.search) {
      const term = `%${req.query.search}%`;
      const start = values.length + 1;
      clauses.push(`(t.transaction_code ILIKE $${start} OR t.transaction_reference ILIKE $${start + 1} OR o.buyer_name ILIKE $${start + 2} OR o.seller_name ILIKE $${start + 3})`);
      values.push(term, term, term, term);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await pool.execute(`${detailSql} ${where} ORDER BY t.created_at DESC LIMIT ${limit} OFFSET ${offset}`, values);
    const [[count]] = await pool.execute(`SELECT COUNT(*) total FROM transactions t LEFT JOIN orders o ON o.id=t.order_id ${where}`, values);
    return res.json({ items: rows.map(normalize), pagination: { page, limit, total: Number(count.total), pages: Math.ceil(count.total / limit) } });
  } catch (error) { return next(error); }
}

export async function adminSummary(_req, res, next) {
  try {
    const [[totals], [methods], [months]] = await Promise.all([
      pool.execute(`SELECT COUNT(*) total_transactions,
        COALESCE(SUM(CASE WHEN status IN ('received','verified','completed') THEN amount ELSE 0 END),0) total_paid,
        COALESCE(SUM(CASE WHEN status IN ('pending','sent') THEN amount ELSE 0 END),0) pending_amount,
        COUNT(*) FILTER (WHERE payment_method='cash_on_delivery') cod_transactions FROM transactions`),
      pool.execute('SELECT payment_method name,COUNT(*) value FROM transactions GROUP BY payment_method ORDER BY value DESC'),
      pool.execute(`SELECT TO_CHAR(created_at,'YYYY-MM') month,SUM(amount) amount,COUNT(*) transactions
        FROM transactions WHERE created_at>=CURRENT_DATE-INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at,'YYYY-MM') ORDER BY month`)
    ]);
    return res.json({ ...totals[0], methods, months });
  } catch (error) { return next(error); }
}
