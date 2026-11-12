import express from 'express';
import { getPublicKiosks, getPublicKioskById } from '../controllers/publicController.js';

const router = express.Router();

// Public Kiosk Locator endpoints (Unauthenticated, strictly sanitized)
router.get('/kiosks', getPublicKiosks);
router.get('/kiosks/:id', getPublicKioskById);

export default router;
