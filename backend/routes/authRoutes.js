import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { login, me, register, requestPasswordReset, resetPassword, updateMe } from '../controllers/authController.js';
import { loginLimiter, recoveryLimiter, registrationLimiter, resetLimiter } from '../middleware/authRateLimits.js';

const router = Router();

router.post('/register', registrationLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/logout', (_req, res) => res.status(204).send());
router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateMe);
router.post('/forgot-password', recoveryLimiter, requestPasswordReset);
router.post('/reset-password', resetLimiter, resetPassword);

export default router;
