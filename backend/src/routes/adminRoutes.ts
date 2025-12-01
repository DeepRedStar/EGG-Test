import { Router } from 'express';
import {
  createCache,
  createInvite,
  deleteCache,
  deleteInvite,
  createEvent,
  listEvents,
  updateEvent,
  listCaches,
  listInvites,
  listSettings,
  updateCache,
  upsertSetting,
} from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

router.get('/caches', listCaches);
router.post('/caches', createCache);
router.put('/caches/:id', updateCache);
router.delete('/caches/:id', deleteCache);

router.get('/invites', listInvites);
router.post('/invites', createInvite);
router.delete('/invites/:id', deleteInvite);

router.get('/settings', listSettings);
router.post('/settings', upsertSetting);

router.get('/events', listEvents);
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);

export default router;
