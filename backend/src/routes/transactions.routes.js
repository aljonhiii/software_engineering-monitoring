import express from 'express';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransactionStatus,
} from '../controllers/transactionsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getAllTransactions);
router.get('/:id', verifyToken, getTransactionById);
router.post('/', createTransaction); // Invoked by kiosk or simulator
router.patch('/:id', updateTransactionStatus); // Invoked by kiosk wash updates

export default router;
