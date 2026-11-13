import express from 'express';
import {
  launchKiosk,
  detectKiosk,
  registerKiosk,
  getNetworkInfo,
} from '../controllers/launcherController.js';

const router = express.Router();

router.get('/kiosk', launchKiosk);
router.get('/detect', detectKiosk);
router.get('/network-info', getNetworkInfo);
router.post('/register', registerKiosk);

export default router;
