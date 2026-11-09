import express from 'express';
import { getSalesReports } from '../controllers/salesController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Owner and Admin can view sales reports
router.get('/reports', verifyToken, requireRole(['owner', 'admin']), getSalesReports);

export default router;
