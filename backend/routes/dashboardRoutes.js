import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { pool } from '../config/db.js';

const router = Router();

router.get('/public-summary', async (_req, res, next) => {
  try {
    const [[rows]] = await Promise.all([
      pool.execute(`SELECT
        (SELECT COUNT(*) FROM users WHERE role='farmer' AND is_active=TRUE) farmers,
        (SELECT COUNT(*) FROM users WHERE role='buyer' AND is_active=TRUE) buyers,
        (SELECT COUNT(*) FROM crop_listings WHERE status='active') active_listings,
        (SELECT COUNT(*) FROM products WHERE status='available') active_products,
        (SELECT COUNT(*) FROM orders) orders,
        (SELECT COUNT(*) FROM orders WHERE status='delivered') successful_trades,
        (SELECT COUNT(DISTINCT district) FROM users WHERE district IS NOT NULL AND district<>'') districts,
        (SELECT COUNT(*) FROM equipment WHERE availability='available' AND approval_status='approved') available_equipment,
        (SELECT COUNT(*) FROM vehicles WHERE availability='available' AND approval_status='approved') available_vehicles`)
    ]);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.get('/market-price-trends', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`WITH market_rows AS (
      SELECT TO_JSONB(row_data) data FROM market_prices row_data
    ), normalized AS (
      SELECT
        data->>'crop_name' crop_name,
        COALESCE(
          NULLIF(data->>'date','')::timestamp,
          NULLIF(data->>'created_at','')::timestamp
        ) recorded_at,
        NULLIF(data->>'price','')::numeric price
      FROM market_rows
    )
    SELECT
      crop_name,
      TO_CHAR(DATE_TRUNC('month',recorded_at),'YYYY-MM') month,
      AVG(price) price
    FROM normalized
    WHERE crop_name IS NOT NULL
      AND price IS NOT NULL
      AND recorded_at>=CURRENT_DATE-INTERVAL '6 months'
    GROUP BY crop_name,DATE_TRUNC('month',recorded_at)
    ORDER BY DATE_TRUNC('month',recorded_at),crop_name`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.use(authenticate);

router.get('/farmer-summary', authorizeRoles('farmer'), async (req, res, next) => {
  try {
    const [[summary], [orders], [bids], [months]] = await Promise.all([
      pool.execute(`SELECT
        (SELECT COUNT(*) FROM crop_listings WHERE farmer_id=$1) total_listings,
        (SELECT COUNT(*) FROM crop_listings WHERE farmer_id=$1 AND status='active') active_listings,
        (SELECT COALESCE(SUM(sold_quantity),0) FROM crop_listings WHERE farmer_id=$1) sold_products,
        (SELECT COUNT(*) FROM orders WHERE seller_id=$2) total_orders,
        (SELECT COUNT(*) FROM orders WHERE seller_id=$3 AND status='pending') pending_orders,
        (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE seller_id=$4 AND status IN ('received','verified','completed')) revenue,
        (SELECT COUNT(*) FROM equipment_bookings WHERE farmer_id=$5) equipment_bookings,
        (SELECT COUNT(*) FROM equipment_bookings WHERE farmer_id=$6 AND status='pending') equipment_pending,
        (SELECT COUNT(*) FROM equipment_bookings WHERE farmer_id=$7 AND status IN ('approved','confirmed')) equipment_approved,
        (SELECT COUNT(*) FROM transport_bookings WHERE farmer_id=$8) transport_requests,
        (SELECT COUNT(*) FROM transport_bookings WHERE farmer_id=$9 AND status='pending') transport_pending,
        (SELECT COUNT(*) FROM transport_bookings WHERE farmer_id=$10 AND status IN ('accepted','confirmed')) transport_accepted,
        (SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=FALSE) unread_notifications,
        (SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND is_read=FALSE) unread_messages`,
      Array(10).fill(req.user.id)),
      pool.execute('SELECT id,buyer_name,items,total_amount,status,created_at FROM orders WHERE seller_id=$1 ORDER BY created_at DESC LIMIT 5', [req.user.id]),
      pool.execute('SELECT id,buyer_name,crop_name,bid_amount,status,created_at FROM bids WHERE farmer_id=$1 ORDER BY created_at DESC LIMIT 5', [req.user.id]),
      pool.execute(`SELECT TO_CHAR(created_at,'YYYY-MM') AS "month",SUM(amount) sales FROM transactions
        WHERE seller_id=$1 AND status IN ('received','verified','completed') AND created_at>=CURRENT_DATE-INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at,'YYYY-MM') ORDER BY month`, [req.user.id])
    ]);
    res.json({ summary: summary[0], recentOrders: orders, recentBids: bids, months });
  } catch (error) { next(error); }
});

router.get('/farmer-transactions-summary', authorizeRoles('farmer'), async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`SELECT
      COALESCE(SUM(amount),0) total,
      COALESCE(SUM(amount) FILTER (WHERE status IN ('pending','sent')),0) pending,
      COALESCE(SUM(amount) FILTER (WHERE status IN ('received','verified','completed')),0) verified,
      COUNT(*) FILTER (WHERE payment_method='cash_on_delivery') cod
      FROM transactions WHERE seller_id=$1`, [req.user.id]);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.get('/buyer-summary', authorizeRoles('buyer'), async (req, res, next) => {
  try {
    const [[summary]] = await Promise.all([
      pool.execute(`SELECT
        (SELECT COUNT(*) FROM orders WHERE buyer_id=$1) orders,
        (SELECT COUNT(*) FROM orders WHERE buyer_id=$1 AND status IN ('pending','confirmed','processing','shipped')) active_orders,
        (SELECT COALESCE(SUM(CASE WHEN jsonb_typeof(items)='array' THEN jsonb_array_length(items) ELSE 0 END),0)
          FROM orders WHERE buyer_id=$1 AND status='delivered') purchased_products,
        (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE buyer_id=$1 AND status<>'cancelled') total_spent,
        (SELECT COUNT(*) FROM bids WHERE buyer_id=$1 AND status IN ('pending','accepted','countered')) active_bids,
        (SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=FALSE) unread_notifications,
        (SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND is_read=FALSE) unread_messages`,
      [req.user.id])
    ]);
    res.json(summary[0]);
  } catch (error) { next(error); }
});

router.get('/equipment-owner-summary', authorizeRoles('equipment_owner'), async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`SELECT
      (SELECT COUNT(*) FROM equipment WHERE owner_id=$1) equipment,
      (SELECT COUNT(*) FROM equipment WHERE owner_id=$1 AND availability='available' AND approval_status='approved') available_equipment,
      (SELECT COUNT(*) FROM equipment_bookings WHERE owner_id=$1) bookings,
      (SELECT COUNT(*) FROM equipment_bookings WHERE owner_id=$1 AND status IN ('approved','confirmed','active')) active_bookings,
      (SELECT COALESCE(SUM(total_cost),0) FROM equipment_bookings WHERE owner_id=$1 AND status='completed') revenue,
      (SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=FALSE) unread_notifications,
      (SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND is_read=FALSE) unread_messages`,
    [req.user.id]);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.get('/transport-provider-summary', authorizeRoles('transport_provider'), async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`SELECT
      (SELECT COUNT(*) FROM vehicles WHERE owner_id=$1) vehicles,
      (SELECT COUNT(*) FROM vehicles WHERE owner_id=$1 AND availability='available' AND approval_status='approved') available_vehicles,
      (SELECT COUNT(*) FROM transport_bookings WHERE provider_id=$1) bookings,
      (SELECT COUNT(*) FROM transport_bookings WHERE provider_id=$1 AND status IN ('accepted','confirmed','in_transit')) active_trips,
      (SELECT COALESCE(SUM(estimated_cost),0) FROM transport_bookings WHERE provider_id=$1 AND status IN ('delivered','completed')) revenue,
      (SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=FALSE) unread_notifications,
      (SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND is_read=FALSE) unread_messages`,
    [req.user.id]);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.get('/admin-summary', authorizeRoles('admin'), async (_req, res, next) => {
  try {
    const [[summary], [roles], [months]] = await Promise.all([
      pool.execute(`SELECT
        (SELECT COUNT(*) FROM users) users,
        (SELECT COUNT(*) FROM crop_listings) listings,
        (SELECT COUNT(*) FROM crop_listings WHERE status='active') active_listings,
        (SELECT COUNT(*) FROM products) products,
        (SELECT COUNT(*) FROM orders) orders,
        (SELECT COUNT(*) FROM equipment_bookings)+(SELECT COUNT(*) FROM transport_bookings) bookings,
        (SELECT COUNT(*) FROM transactions) transactions,
        (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE status IN ('received','verified','completed')) revenue,
        (SELECT COUNT(*) FROM crop_listings WHERE status='pending')+
        (SELECT COUNT(*) FROM equipment WHERE approval_status='pending')+
        (SELECT COUNT(*) FROM vehicles WHERE approval_status='pending') pending,
        (SELECT COUNT(*) FROM crop_listings WHERE status IN ('sold','sold_out')) sold_out`),
      pool.execute('SELECT role name,COUNT(*) value FROM users GROUP BY role'),
      pool.execute(`SELECT TO_CHAR(created_at,'YYYY-MM') AS "month",COUNT(*) orders FROM orders
        WHERE created_at>=CURRENT_DATE-INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at,'YYYY-MM') ORDER BY month`)
    ]);
    const roleMap = Object.fromEntries(roles.map((item) => [item.name, Number(item.value)]));
    res.json({ ...summary[0], roles, months, farmers: roleMap.farmer || 0, buyers: roleMap.buyer || 0, equipmentOwners: roleMap.equipment_owner || 0, transportOwners: roleMap.transport_provider || 0 });
  } catch (error) { next(error); }
});

router.get('/admin-report', authorizeRoles('admin'), async (_req, res, next) => {
  try {
    const [[summary], [districts], [methods]] = await Promise.all([
      pool.execute(`SELECT
        (SELECT COUNT(*) FROM users) users,
        (SELECT COUNT(*) FROM crop_listings) listings,
        (SELECT COUNT(*) FROM orders) orders,
        (SELECT COUNT(*) FROM transactions) transactions,
        (SELECT COUNT(*) FROM equipment_bookings)+(SELECT COUNT(*) FROM transport_bookings) bookings,
        (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE status IN ('received','verified','completed')) revenue`),
      pool.execute(`SELECT COALESCE(NULLIF(delivery_district,''),'অনির্ধারিত') district,COUNT(*) count
        FROM orders GROUP BY COALESCE(NULLIF(delivery_district,''),'অনির্ধারিত')
        ORDER BY count DESC LIMIT 8`),
      pool.execute(`SELECT COALESCE(NULLIF(payment_method,''),'অনির্ধারিত') method,COALESCE(SUM(amount),0) amount
        FROM transactions GROUP BY COALESCE(NULLIF(payment_method,''),'অনির্ধারিত')
        ORDER BY amount DESC`)
    ]);
    res.json({ summary: summary[0], districts, methods });
  } catch (error) { next(error); }
});

export default router;
