import jwt from 'jsonwebtoken';

function extractToken(req) {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

export function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

export function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'লগইন প্রয়োজন' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
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
