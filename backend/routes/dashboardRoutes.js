import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { pool } from '../config/db.js';

const router = Router();
router.use(authenticate);

router.get('/farmer-summary', authorizeRoles('farmer'), async (req, res, next) => {
  try {
    const [[summary], [orders], [bids], [months]] = await Promise.all([
      pool.execute(`SELECT
        (SELECT COUNT(*) FROM crop_listings WHERE farmer_id=$1 AND status='active') active_listings,
        (SELECT COUNT(*) FROM orders WHERE seller_id=$2) total_orders,
        (SELECT COUNT(*) FROM orders WHERE seller_id=$3 AND status='pending') pending_orders,
        (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE seller_id=$4 AND status IN ('received','verified','completed')) revenue,
        (SELECT COUNT(*) FROM equipment_bookings WHERE farmer_id=$5) equipment_bookings,
        (SELECT COUNT(*) FROM equipment_bookings WHERE farmer_id=$6 AND status='pending') equipment_pending,
        (SELECT COUNT(*) FROM equipment_bookings WHERE farmer_id=$7 AND status IN ('approved','confirmed')) equipment_approved,
        (SELECT COUNT(*) FROM transport_bookings WHERE farmer_id=$8) transport_requests,
        (SELECT COUNT(*) FROM transport_bookings WHERE farmer_id=$9 AND status='pending') transport_pending,
        (SELECT COUNT(*) FROM transport_bookings WHERE farmer_id=$10 AND status IN ('accepted','confirmed')) transport_accepted`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]),
      pool.execute('SELECT id,buyer_name,items,total_amount,status,created_at FROM orders WHERE seller_id=$1 ORDER BY created_at DESC LIMIT 5', [req.user.id]),
      pool.execute('SELECT id,buyer_name,crop_name,bid_amount,status,created_at FROM bids WHERE farmer_id=$1 ORDER BY created_at DESC LIMIT 5', [req.user.id]),
      pool.execute(`SELECT TO_CHAR(created_at,'YYYY-MM') AS "month",SUM(amount) sales FROM transactions
        WHERE seller_id=$1 AND status IN ('received','verified','completed') AND created_at>=CURRENT_DATE-INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at,'YYYY-MM') ORDER BY month`, [req.user.id])
    ]);
    res.json({ summary: summary[0], recentOrders: orders, recentBids: bids, months });
  } catch (error) { next(error); }
});

router.get('/admin-summary', authorizeRoles('admin'), async (_req, res, next) => {
  try {
    const [[summary], [roles], [months]] = await Promise.all([
      pool.execute(`SELECT
        (SELECT COUNT(*) FROM users) users,
        (SELECT COUNT(*) FROM crop_listings) listings,
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

export default router;
