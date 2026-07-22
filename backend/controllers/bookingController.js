import crypto from 'node:crypto';
import { pool } from '../config/db.js';

async function notify(db, userId, title, message, link) {
  await db.execute(
    `INSERT INTO notifications (id,user_id,title,message,type,is_read,link)
     VALUES ($1,$2,$3,$4, 'booking',FALSE,$5) RETURNING id`,
    [crypto.randomUUID(), userId, title, message, link]
  );
}

export async function myEquipmentBookings(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*, e.images, e.type AS equipment_type, e.description, e.rent_price_per_day,
              e.owner_name, u.phone AS owner_phone
       FROM equipment_bookings b
       JOIN equipment e ON e.id=b.equipment_id
       LEFT JOIN users u ON u.id=b.owner_id
       WHERE b.farmer_id=$1 ORDER BY b.created_at DESC LIMIT 100`,
      [req.user.id]
    );
    rows.forEach((row) => {
      if (typeof row.images === 'string') {
        try { row.images = JSON.parse(row.images); } catch { row.images = []; }
      }
    });
    res.json(rows);
  } catch (error) { next(error); }
}

export async function createEquipmentBooking(req, res, next) {
  const { equipment_id: equipmentId, start_date: startDate, end_date: endDate } = req.body;
  if (req.user.role !== 'farmer') return res.status(403).json({ message: 'শুধু কৃষক বুকিং করতে পারবেন' });
  if (!equipmentId || !startDate || !endDate || endDate < startDate) {
    return res.status(400).json({ message: 'সঠিক শুরু ও শেষের তারিখ দিন' });
  }
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [equipmentRows] = await db.execute(
      `SELECT id,name,owner_id,owner_name,rent_price_per_day,availability,approval_status
       FROM equipment WHERE id=$1 FOR UPDATE`,
      [equipmentId]
    );
    const equipment = equipmentRows[0];
    if (!equipment || equipment.approval_status !== 'approved' || equipment.availability !== 'available') {
      await db.rollback();
      return res.status(409).json({ message: 'যন্ত্রপাতিটি বর্তমানে বুকিংয়ের জন্য উপলব্ধ নয়' });
    }
    const [conflicts] = await db.execute(
      `SELECT id FROM equipment_bookings WHERE equipment_id=$1
       AND status IN ('pending','approved','confirmed','active')
       AND start_date<=$2 AND end_date>=$3 LIMIT 1`,
      [equipmentId, endDate, startDate]
    );
    if (conflicts.length) {
      await db.rollback();
      return res.status(409).json({ message: 'নির্বাচিত তারিখে যন্ত্রপাতিটি উপলব্ধ নয়' });
    }
    const days = Math.max(1, Math.floor((new Date(endDate) - new Date(startDate)) / 86400000) + 1);
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO equipment_bookings
       (id,equipment_id,equipment_name,farmer_id,farmer_name,owner_id,owner_name,start_date,end_date,
        rental_days,quantity,pickup_location,notes,total_cost,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending') RETURNING id`,
      [
        id, equipment.id, equipment.name, req.user.id, req.user.full_name || 'কৃষক',
        equipment.owner_id, equipment.owner_name, startDate, endDate, days,
        Math.max(Number(req.body.quantity) || 1, 1), String(req.body.pickup_location || '').trim() || null,
        String(req.body.notes || '').trim().slice(0, 1000) || null,
        days * Number(equipment.rent_price_per_day || 0)
      ]
    );
    await notify(db, equipment.owner_id, 'নতুন যন্ত্রপাতি বুকিং',
      `${req.user.full_name || 'একজন কৃষক'} ${equipment.name} বুকিংয়ের অনুরোধ করেছেন।`,
      '/equipment-owner-dashboard/bookings');
    await notify(db, req.user.id, 'যন্ত্রপাতি বুকিং জমা হয়েছে',
      'আপনার যন্ত্রপাতি বুকিং সফলভাবে জমা হয়েছে।', '/farmer/equipment-booking');
    const [created] = await db.execute('SELECT * FROM equipment_bookings WHERE id=$1', [id]);
    await db.commit();
    res.status(201).json(created[0]);
  } catch (error) {
    await db.rollback();
    next(error);
  } finally { db.release(); }
}

export async function updateEquipmentBooking(req, res, next) {
  const status = req.body.status;
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [rows] = await db.execute('SELECT * FROM equipment_bookings WHERE id=$1 FOR UPDATE', [req.params.id]);
    const booking = rows[0];
    if (!booking) {
      await db.rollback();
      return res.status(404).json({ message: 'বুকিং পাওয়া যায়নি' });
    }
    const farmerCancel = booking.farmer_id === req.user.id && booking.status === 'pending' && status === 'cancelled';
    const ownerChange = booking.owner_id === req.user.id && (
      (booking.status === 'pending' && ['approved', 'rejected'].includes(status))
      || (['approved', 'confirmed'].includes(booking.status) && ['active', 'completed', 'cancelled'].includes(status))
      || (booking.status === 'active' && status === 'completed')
    );
    if (req.user.role !== 'admin' && !farmerCancel && !ownerChange) {
      await db.rollback();
      return res.status(403).json({ message: 'এই বুকিং পরিবর্তনের অনুমতি নেই' });
    }
    await db.execute('UPDATE equipment_bookings SET status=$1 WHERE id=$2', [status, booking.id]);
    const messages = {
      approved: ['যন্ত্রপাতি বুকিং অনুমোদিত', 'আপনার যন্ত্রপাতি বুকিং অনুমোদন করা হয়েছে।'],
      rejected: ['যন্ত্রপাতি বুকিং প্রত্যাখ্যাত', 'আপনার যন্ত্রপাতি বুকিং প্রত্যাখ্যান করা হয়েছে।'],
      cancelled: ['যন্ত্রপাতি বুকিং বাতিল', 'যন্ত্রপাতি বুকিং বাতিল করা হয়েছে।'],
      completed: ['যন্ত্রপাতি বুকিং সম্পন্ন', 'আপনার যন্ত্রপাতি বুকিং সম্পন্ন হয়েছে।']
    };
    if (messages[status]) {
      const recipient = farmerCancel ? booking.owner_id : booking.farmer_id;
      await notify(db, recipient, messages[status][0], messages[status][1],
        farmerCancel ? '/equipment-owner-dashboard/bookings' : '/farmer/equipment-booking');
    }
    const [updated] = await db.execute('SELECT * FROM equipment_bookings WHERE id=$1', [booking.id]);
    await db.commit();
    res.json(updated[0]);
  } catch (error) {
    await db.rollback();
    next(error);
  } finally { db.release(); }
}

export async function myTransportBookings(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*, v.images, v.capacity, v.price_per_km, v.owner_name AS provider_name,
              u.phone AS provider_phone
       FROM transport_bookings b JOIN vehicles v ON v.id=b.vehicle_id
       LEFT JOIN users u ON u.id=b.provider_id
       WHERE b.farmer_id=$1 ORDER BY b.created_at DESC LIMIT 100`,
      [req.user.id]
    );
    rows.forEach((row) => {
      if (typeof row.images === 'string') {
        try { row.images = JSON.parse(row.images); } catch { row.images = []; }
      }
    });
    res.json(rows);
  } catch (error) { next(error); }
}

export async function createTransportBooking(req, res, next) {
  const { vehicle_id: vehicleId, pickup_date: pickupDate, pickup_location: pickup, delivery_location: destination } = req.body;
  if (req.user.role !== 'farmer') return res.status(403).json({ message: 'শুধু কৃষক পরিবহন বুক করতে পারবেন' });
  if (!vehicleId || !pickupDate || !pickup || !destination) {
    return res.status(400).json({ message: 'যানবাহন, স্থান ও তারিখের তথ্য পূরণ করুন' });
  }
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [vehicleRows] = await db.execute(
      `SELECT id,vehicle_type,owner_id,owner_name,price_per_km,availability,approval_status
       FROM vehicles WHERE id=$1 FOR UPDATE`,
      [vehicleId]
    );
    const vehicle = vehicleRows[0];
    if (!vehicle || vehicle.approval_status !== 'approved' || vehicle.availability !== 'available') {
      await db.rollback();
      return res.status(409).json({ message: 'যানবাহনটি বর্তমানে উপলব্ধ নয়' });
    }
    const [conflicts] = await db.execute(
      `SELECT id FROM transport_bookings WHERE vehicle_id=$1 AND pickup_date=$2
       AND status IN ('pending','accepted','confirmed','in_transit') LIMIT 1`,
      [vehicleId, pickupDate]
    );
    if (conflicts.length) {
      await db.rollback();
      return res.status(409).json({ message: 'নির্বাচিত তারিখে যানবাহনটি উপলব্ধ নয়' });
    }
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO transport_bookings
       (id,vehicle_id,vehicle_type,farmer_id,farmer_name,provider_id,provider_name,pickup_location,
        delivery_location,pickup_date,preferred_time,product_name,quantity,estimated_cost,status,
        cargo_description,additional_instructions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending',$15,$16) RETURNING id`,
      [
        id, vehicle.id, vehicle.vehicle_type, req.user.id, req.user.full_name || 'কৃষক',
        vehicle.owner_id, vehicle.owner_name, String(pickup).trim(), String(destination).trim(), pickupDate,
        req.body.preferred_time || null, String(req.body.product_name || '').trim() || null,
        String(req.body.quantity || '').trim() || null, Number(req.body.estimated_cost) || Number(vehicle.price_per_km || 0) * 50,
        String(req.body.cargo_description || '').trim().slice(0, 1000) || null,
        String(req.body.additional_instructions || '').trim().slice(0, 1000) || null
      ]
    );
    await notify(db, vehicle.owner_id, 'নতুন পরিবহন অনুরোধ',
      `${req.user.full_name || 'একজন কৃষক'} পরিবহন বুকিংয়ের অনুরোধ করেছেন।`,
      '/transport-dashboard/bookings');
    await notify(db, req.user.id, 'পরিবহন অনুরোধ জমা হয়েছে',
      'আপনার পরিবহন অনুরোধ সফলভাবে জমা হয়েছে।', '/farmer/transport-request');
    const [created] = await db.execute('SELECT * FROM transport_bookings WHERE id=$1', [id]);
    await db.commit();
    res.status(201).json(created[0]);
  } catch (error) {
    await db.rollback();
    next(error);
  } finally { db.release(); }
}

export async function updateTransportBooking(req, res, next) {
  const status = req.body.status;
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [rows] = await db.execute('SELECT * FROM transport_bookings WHERE id=$1 FOR UPDATE', [req.params.id]);
    const booking = rows[0];
    if (!booking) {
      await db.rollback();
      return res.status(404).json({ message: 'পরিবহন অনুরোধ পাওয়া যায়নি' });
    }
    const farmerCancel = booking.farmer_id === req.user.id && booking.status === 'pending' && status === 'cancelled';
    const providerChange = booking.provider_id === req.user.id && (
      (booking.status === 'pending' && ['accepted', 'rejected'].includes(status))
      || (['accepted', 'confirmed'].includes(booking.status) && ['in_transit', 'cancelled'].includes(status))
      || (booking.status === 'in_transit' && status === 'completed')
    );
    if (req.user.role !== 'admin' && !farmerCancel && !providerChange) {
      await db.rollback();
      return res.status(403).json({ message: 'এই অনুরোধ পরিবর্তনের অনুমতি নেই' });
    }
    await db.execute('UPDATE transport_bookings SET status=$1 WHERE id=$2', [status, booking.id]);
    const messages = {
      accepted: ['পরিবহন অনুরোধ গ্রহণ করা হয়েছে', 'আপনার পরিবহন অনুরোধ গ্রহণ করা হয়েছে।'],
      rejected: ['পরিবহন অনুরোধ প্রত্যাখ্যাত', 'আপনার পরিবহন অনুরোধ প্রত্যাখ্যান করা হয়েছে।'],
      cancelled: ['পরিবহন অনুরোধ বাতিল', 'পরিবহন অনুরোধ বাতিল করা হয়েছে।'],
      completed: ['পরিবহন বুকিং সম্পন্ন হয়েছে', 'পরিবহন বুকিং সম্পন্ন হয়েছে।']
    };
    if (messages[status]) {
      const recipient = farmerCancel ? booking.provider_id : booking.farmer_id;
      await notify(db, recipient, messages[status][0], messages[status][1],
        farmerCancel ? '/transport-dashboard/bookings' : '/farmer/transport-request');
    }
    const [updated] = await db.execute('SELECT * FROM transport_bookings WHERE id=$1', [booking.id]);
    await db.commit();
    res.json(updated[0]);
  } catch (error) {
    await db.rollback();
    next(error);
  } finally { db.release(); }
}
