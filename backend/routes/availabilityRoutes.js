import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/equipment/:id', async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) return res.status(400).json({ message: 'শুরু ও শেষ তারিখ দিন' });
    const [rows] = await pool.execute(
      `SELECT id FROM equipment_bookings
       WHERE equipment_id = ? AND status IN ('pending','confirmed','active')
         AND start_date <= ? AND end_date >= ? LIMIT 1`,
      [req.params.id, end_date, start_date]
    );
    res.json({ available: rows.length === 0 });
  } catch (error) {
    next(error);
  }
});

router.get('/transport/:id', async (req, res, next) => {
  try {
    const { pickup_date } = req.query;
    if (!pickup_date) return res.status(400).json({ message: 'পিকআপের তারিখ দিন' });
    const [rows] = await pool.execute(
      `SELECT id FROM transport_bookings
       WHERE vehicle_id = ? AND pickup_date = ?
         AND status IN ('pending','confirmed','in_transit') LIMIT 1`,
      [req.params.id, pickup_date]
    );
    res.json({ available: rows.length === 0 });
  } catch (error) {
    next(error);
  }
});

export default router;
