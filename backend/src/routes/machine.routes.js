import express from 'express';
import { getMachineStatus, recordHeartbeat } from '../controllers/machineController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/status', verifyToken, getMachineStatus);
router.post('/heartbeat', recordHeartbeat); // ESP32 controller / Kiosk heartbeat

export default router;
