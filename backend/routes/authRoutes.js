import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { login, me, register, requestPasswordReset, resetPassword, updateMe } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', (_req, res) => res.status(204).send());
router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateMe);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;
