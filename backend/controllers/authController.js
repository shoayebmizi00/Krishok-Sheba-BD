import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const roles = new Set(['admin', 'farmer', 'buyer', 'equipment_owner', 'transport_provider']);

function publicUser(user) {
  const { password_hash, reset_password_token, reset_password_expires, ...safeUser } = user;
  return {
    ...safeUser,
    created_date: safeUser.created_at,
    updated_date: safeUser.updated_at
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function register(req, res, next) {
  let connection;
  let normalizedEmail = '';
  let role = 'farmer';

  try {
    const { email, password, full_name = '' } = req.body;
    role = req.body.role || 'farmer';
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'ইমেইল ও পাসওয়ার্ড আবশ্যক' });
    }
    if (password.length < 8) return res.status(400).json({ message: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে' });
    if (!roles.has(role) || role === 'admin') return res.status(400).json({ message: 'অ্যাকাউন্টের ধরন সঠিক নয়' });

    normalizedEmail = email.trim().toLowerCase();
    const normalizedName = typeof full_name === 'string' ? full_name.trim() : '';
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return res.status(400).json({ message: 'সঠিক ইমেইল ঠিকানা দিন' });
    }
    if (!normalizedName) {
      return res.status(400).json({ message: 'পূর্ণ নাম আবশ্যক' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1 FOR UPDATE',
      [normalizedEmail]
    );
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ message: 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে' });
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    await connection.execute(
      'INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [id, normalizedEmail, passwordHash, normalizedName, role]
    );
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
    const user = rows[0];
    const token = signToken(user);
    await connection.commit();
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[auth.register] Registration failed', {
      requestId: req.id,
      emailDomain: normalizedEmail.split('@')[1] || 'invalid',
      role,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      message: error.message,
      stack: error.stack
    });
    next(error);
  } finally {
    connection?.release();
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'ইমেইল ও পাসওয়ার্ড আবশ্যক' });
    }
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
    const user = rows[0];
    if (!user || !user.is_active || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).json({ message: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়' });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ message: 'ব্যবহারকারী পাওয়া যায়নি' });
    res.json(publicUser(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const allowed = [
      'full_name', 'phone', 'district', 'farm_name', 'land_size', 'crops_grown',
      'profile_picture', 'bkash_number', 'nagad_number', 'rocket_number',
      'upay_number', 'bank_name', 'bank_account_number',
      'account_holder_name', 'branch_name'
    ];
    const entries = Object.entries(req.body).filter(([field]) => allowed.includes(field));
    if (!entries.length) return me(req, res, next);
    const assignments = entries.map(([field]) => `\`${field}\` = ?`).join(', ');
    await pool.execute(`UPDATE users SET ${assignments} WHERE id = ?`, [...entries.map(([, value]) => value), req.user.id]);
    return me(req, res, next);
  } catch (error) {
    next(error);
  }
}

export async function requestPasswordReset(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    let resetToken;
    if (rows[0]) {
      resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const minutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 30);
      await pool.execute(
        'UPDATE users SET reset_password_token = ?, reset_password_expires = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?',
        [tokenHash, minutes, rows[0].id]
      );
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Password reset URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
      }
    }
    const response = { message: 'অ্যাকাউন্টটি থাকলে পাসওয়ার্ড পুনরুদ্ধারের লিংক তৈরি হয়েছে' };
    if (process.env.NODE_ENV !== 'production' && resetToken) response.resetToken = resetToken;
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'সঠিক টোকেন ও কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW() LIMIT 1',
      [tokenHash]
    );
    if (!rows[0]) return res.status(400).json({ message: 'পুনরুদ্ধার টোকেন সঠিক নয় বা মেয়াদ শেষ' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.execute(
      'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [passwordHash, rows[0].id]
    );
    res.json({ message: 'পাসওয়ার্ড সফলভাবে হালনাগাদ হয়েছে' });
  } catch (error) {
    next(error);
  }
}
