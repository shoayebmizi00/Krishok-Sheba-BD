import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

function extractToken(req) {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

export function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    req.user = null;
  }
  next();
}

export async function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'লগইন প্রয়োজন' });

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!claims?.id) return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Authentication token is invalid.' });
    const [rows] = await pool.execute('SELECT id, email, role, is_active FROM users WHERE id = $1 LIMIT 1', [claims.id]);
    const user = rows[0];
    if (!user?.is_active) return res.status(401).json({ code: 'ACCOUNT_UNAVAILABLE', message: 'This account is no longer available.' });
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    if (!['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) return next(error);
    return res.status(401).json({ message: 'লগইনের মেয়াদ শেষ হয়েছে, আবার লগইন করুন' });
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'এই কাজ করার অনুমতি আপনার নেই' });
    }
    next();
  };
}
