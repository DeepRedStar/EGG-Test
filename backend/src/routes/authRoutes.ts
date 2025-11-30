import { Router } from 'express';
import { login, logout, registerWithInvite } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/register', registerWithInvite);

export default router;
