import { Router } from 'express';
import { cachesInRadius, listActiveEvents, markFound } from '../controllers/playerController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/caches/nearby', cachesInRadius);
router.post('/caches/found', markFound);
router.get('/events', listActiveEvents);

export default router;
