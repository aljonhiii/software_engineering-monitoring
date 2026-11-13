import express from 'express';
import {
  launchKiosk,
  detectKiosk,
  registerKiosk,
} from '../controllers/launcherController.js';

const router = express.Router();

router.get('/kiosk', launchKiosk);
router.get('/detect', detectKiosk);
router.post('/register', registerKiosk);

export default router;
