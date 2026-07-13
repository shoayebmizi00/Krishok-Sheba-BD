import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { getEmailConfiguration, sendPasswordResetEmail } from '../services/emailService.js';
import { isValidEmail, normalizeEmail, passwordPolicy } from '../utils/authValidation.js';

const roles = new Set(['admin', 'farmer', 'buyer', 'equipment_owner', 'transport_provider']);
const dummyPasswordHash = '$2b$12$/7rXs2Rk6qxCMZ8v92L/zunksTk6SGMcGsnnpQI4DeQ/vRbMkmH2S';
const frontendUrl = () => String(process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function publicUser(user) {
  const { password_hash, reset_password_token, reset_password_expires, email_verification_token, email_verification_expires, ...safeUser } = user;
  return { ...safeUser, created_date: safeUser.created_at, updated_date: safeUser.updated_at };
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

export async function register(req, res, next) {
  let connection;
  try {
    const email = normalizeEmail(req.body.email);
    const { password, full_name = '' } = req.body;
    const role = req.body.role || 'farmer';
    if (!isValidEmail(email)) return res.status(400).json({ code: 'INVALID_EMAIL', message: 'Please provide a valid email address.' });
    if (!passwordPolicy.test(password)) return res.status(400).json({ code: 'INVALID_PASSWORD', message: 'Password must contain at least 8 characters, uppercase, lowercase, and a number.' });
    if (!roles.has(role) || role === 'admin') return res.status(400).json({ code: 'INVALID_ROLE', message: 'Invalid account type.' });
    const name = typeof full_name === 'string' ? full_name.trim() : '';
    if (!name || name.length > 120) return res.status(400).json({ code: 'FULL_NAME_REQUIRED', message: 'Full name is required and must not exceed 120 characters.' });

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1 FOR UPDATE', [email]);
    if (existing.length) { await connection.rollback(); return res.status(409).json({ code: 'EMAIL_EXISTS', message: 'An account already exists for this email.' }); }
    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    await connection.execute(
      'INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
      [id, email, passwordHash, name, role]
    );
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
    await connection.commit();
    res.status(201).json({ success: true, user: publicUser(rows[0]), message: 'Account created successfully. Please log in.' });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ code: 'EMAIL_EXISTS', message: 'An account already exists for this email.' });
    next(error);
  }
  finally { connection?.release(); }
}
export async function login(req, res, next) {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email) || typeof password !== 'string' || !password) return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user?.password_hash || dummyPasswordHash);
    if (!user || !user.is_active || !passwordMatches) return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
}

export async function me(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ message: 'User not found.' });
    res.json(publicUser(rows[0]));
  } catch (error) { next(error); }
}

export async function updateMe(req, res, next) {
  try {
    const allowed = ['full_name', 'phone', 'district', 'farm_name', 'land_size', 'crops_grown', 'profile_picture', 'bkash_number', 'nagad_number', 'rocket_number', 'upay_number', 'bank_name', 'bank_account_number', 'account_holder_name', 'branch_name'];
    const entries = Object.entries(req.body).filter(([field]) => allowed.includes(field));
    if (!entries.length) return me(req, res, next);
    const assignments = entries.map(([field]) => `\`${field}\` = ?`).join(', ');
    await pool.execute(`UPDATE users SET ${assignments} WHERE id = ?`, [...entries.map(([, value]) => value), req.user.id]);
    return me(req, res, next);
  } catch (error) { next(error); }
}

const neutralRecovery = { message: 'If an account exists for this email, password reset instructions have been sent.' };
export async function requestPasswordReset(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) return res.status(400).json({ code: 'INVALID_EMAIL', message: 'Please provide a valid email address.' });
    if (!getEmailConfiguration().configured) return res.status(503).json({ code: 'PASSWORD_RESET_UNAVAILABLE', message: 'Password reset email is temporarily unavailable.' });
    const [rows] = await pool.execute('SELECT id, email, full_name FROM users WHERE email = ? LIMIT 1', [email]);
    if (rows[0]) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const configured = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 30);
      const minutes = Number.isFinite(configured) && configured >= 5 && configured <= 60 ? configured : 30;
      await pool.execute('UPDATE users SET reset_password_token = ?, reset_password_expires = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?', [hashToken(rawToken), minutes, rows[0].id]);
      try {
        const delivery = await sendPasswordResetEmail({ to: rows[0].email, name: rows[0].full_name, resetUrl: `${frontendUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`, expiresMinutes: minutes });
        if (!delivery.sent) return res.status(503).json({ code: 'PASSWORD_RESET_UNAVAILABLE', message: 'Password reset email is temporarily unavailable.' });
      } catch (error) {
        console.error('[auth.password-reset] Delivery failed', { requestId: req.id, code: error.code, message: error.message });
        return res.status(503).json({ code: 'PASSWORD_RESET_UNAVAILABLE', message: 'Password reset email is temporarily unavailable.' });
      }
    }
    res.json(neutralRecovery);
  } catch (error) { next(error); }
}

export async function resetPassword(req, res, next) {
  let connection;
  try {
    const { token, newPassword } = req.body;
    if (typeof token !== 'string' || !/^[a-f\d]{64}$/i.test(token) || !passwordPolicy.test(newPassword)) return res.status(400).json({ code: 'INVALID_RESET_REQUEST', message: 'Use a valid link and a password with uppercase, lowercase, and a number.' });
    connection = await pool.getConnection(); await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW() LIMIT 1 FOR UPDATE', [hashToken(token)]);
    if (!rows[0]) { await connection.rollback(); return res.status(400).json({ code: 'INVALID_OR_EXPIRED_RESET_TOKEN', message: 'This reset link is invalid, expired, or already used.' }); }
    await connection.execute('UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?', [await bcrypt.hash(newPassword, 12), rows[0].id]);
    await connection.commit(); res.json({ message: 'Password reset successful.' });
  } catch (error) { if (connection) await connection.rollback(); next(error); }
  finally { connection?.release(); }
}
