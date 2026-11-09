import express from 'express';
import { registerPushToken } from '../controllers/notificationsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register-token', verifyToken, registerPushToken);

export default router;
