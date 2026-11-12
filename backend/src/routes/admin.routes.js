import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  getAdminOverview,
  getAdminKiosks,
  createAdminKiosk,
  updateAdminKiosk,
  updateAdminKioskStatus,
  getAdminBuyers,
  createAdminBuyer,
  updateAdminBuyer,
  updateAdminBuyerStatus,
  generateBuyerInvite,
  getAdminAssignments,
  assignKiosksToBuyer,
  removeKioskAssignment,
} from '../controllers/adminController.js';

const router = express.Router();

// Protect all /api/admin routes: strictly Super Admin only
router.use(verifyToken, requireRole(['superadmin']));

// Overview
router.get('/overview', getAdminOverview);

// Kiosk Management
router.get('/kiosks', getAdminKiosks);
router.post('/kiosks', createAdminKiosk);
router.put('/kiosks/:id', updateAdminKiosk);
router.patch('/kiosks/:id/status', updateAdminKioskStatus);

// Buyer Management
router.get('/buyers', getAdminBuyers);
router.post('/buyers', createAdminBuyer);
router.put('/buyers/:id', updateAdminBuyer);
router.patch('/buyers/:id/status', updateAdminBuyerStatus);
router.post('/buyers/:id/invite', generateBuyerInvite);

// Kiosk Ownership Assignment Management
router.get('/assignments', getAdminAssignments);
router.post('/assignments', assignKiosksToBuyer);
router.delete('/assignments/:kioskId', removeKioskAssignment);

export default router;
