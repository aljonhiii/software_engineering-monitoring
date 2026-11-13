import express from 'express';
import {
  getPublicKiosks,
  getPublicKioskById,
  createInquiry,
} from '../controllers/publicController.js';

const router = express.Router();

// Public Kiosk Locator endpoints (Unauthenticated, strictly sanitized)
router.get('/kiosks', getPublicKiosks);
router.get('/kiosks/:id', getPublicKioskById);

// Public Order / Contact Inquiries (No auth required)
router.post('/inquiries', createInquiry);

export default router;
