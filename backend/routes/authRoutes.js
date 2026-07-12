import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { login, me, register, requestPasswordReset, resendVerification, resetPassword, updateMe, verifyEmail } from '../controllers/authController.js';
import { loginLimiter, recoveryLimiter, registrationLimiter, resetLimiter, verificationLimiter } from '../middleware/authRateLimits.js';

const router = Router();

router.post('/register', registrationLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/logout', (_req, res) => res.status(204).send());
router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateMe);
router.post('/forgot-password', recoveryLimiter, requestPasswordReset);
router.post('/reset-password', resetLimiter, resetPassword);
router.get('/verify-email', verificationLimiter, verifyEmail);
router.post('/resend-verification', verificationLimiter, resendVerification);

export default router;
