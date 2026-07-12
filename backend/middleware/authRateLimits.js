import { rateLimit } from 'express-rate-limit';

const handler = (_req, res) => res.status(429).json({ code: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts. Please try again later.' });
const createLimiter = (windowMs, limit) => rateLimit({ windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false, handler });

export const loginLimiter = createLimiter(15 * 60_000, 10);
export const registrationLimiter = createLimiter(60 * 60_000, 10);
export const recoveryLimiter = createLimiter(15 * 60_000, 5);
export const resetLimiter = createLimiter(15 * 60_000, 10);
export const verificationLimiter = createLimiter(60 * 60_000, 5);

