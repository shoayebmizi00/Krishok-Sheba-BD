import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';

export function createResourceRouter(controller, config) {
  const router = Router();
  router.get('/', config.publicRead ? optionalAuth : authenticate, controller.list);
  router.get('/:id', config.publicRead ? optionalAuth : authenticate, controller.get);
  router.post('/', authenticate, controller.create);
  router.patch('/:id', authenticate, controller.update);
  router.delete('/:id', authenticate, controller.remove);
  return router;
}
