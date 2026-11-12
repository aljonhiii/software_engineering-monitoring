import express from 'express';
import {
  login,
  getMe,
  changePassword,
  verifyInviteToken,
  completeAccountSetup,
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.post('/change-password', verifyToken, changePassword);

// Buyer Account Invitation & Setup Endpoints
router.get('/verify-invite', verifyInviteToken);
router.post('/complete-setup', completeAccountSetup);

export default router;
