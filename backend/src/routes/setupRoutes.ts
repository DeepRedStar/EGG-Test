import { Router } from 'express';
import { initializeSetup, setupStatus } from '../controllers/setupController.js';

const router = Router();

router.get('/status', setupStatus);
router.post('/initialize', initializeSetup);

export default router;
