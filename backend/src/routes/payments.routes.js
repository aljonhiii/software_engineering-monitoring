import express from 'express';
import { getPaymentsLedger } from '../controllers/paymentsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getPaymentsLedger);
router.get('/ledger', verifyToken, getPaymentsLedger);

export default router;
