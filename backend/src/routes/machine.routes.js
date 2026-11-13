import express from 'express';
import {
  getMachineStatus,
  recordHeartbeat,
  registerKioskLocation,
} from '../controllers/machineController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/status', verifyToken, getMachineStatus);
router.post('/register-location', verifyToken, registerKioskLocation);
router.post('/heartbeat', recordHeartbeat); // ESP32 controller / Kiosk heartbeat

export default router;
