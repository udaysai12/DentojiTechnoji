// routes/receptionistRoutes.js
import express from 'express';
import {
  registerReceptionist,
  loginReceptionist,
  updateReceptionist,
  deleteReceptionist,
  listofReceptionist,
  getTempPassword,
  changePassword,
  fixPasswordEncryption,
  getReceptionistCount,
  checkReceptionistLimit
} from '../controllers/receptionistController.js';
import {
  verifyToken,
  verifyTokenWithSubscription,
  checkHospitalRegistration,
  authorizeRoles,
  requireFeature
} from '../middleware/authMiddleware.js';

const router = express.Router();

// ⚠️ IMPORTANT: Public routes MUST come BEFORE protected middleware!

// Public authentication routes
router.post('/login', loginReceptionist);

// Admin utility routes (for fixing password encryption issues)
router.post('/fix-passwords',
  verifyToken,
  authorizeRoles(['Admin']),
  fixPasswordEncryption
);

// Basic protected routes (requires authentication only)
router.get('/list', verifyToken, listofReceptionist);

// Password management routes (basic authentication)
router.get('/:id/temp-password',
  verifyToken,
  authorizeRoles(['Admin']),
  getTempPassword
);

router.put('/:id/change-password',
  verifyToken,
  changePassword
);

// Receptionist management routes (Admin only, requires subscription and hospital)
// Option 1: No specific feature requirement - just active subscription
router.post('/register',
  verifyTokenWithSubscription,
  checkHospitalRegistration,
  authorizeRoles(['Admin']),
  registerReceptionist
);

router.post('/',
  verifyTokenWithSubscription,
  checkHospitalRegistration,
  authorizeRoles(['Admin']),
  registerReceptionist
);

// Update receptionist (Admin only with subscription)
router.put('/:id',
  verifyTokenWithSubscription,
  checkHospitalRegistration,
  authorizeRoles(['Admin']),
  updateReceptionist
);

// Alternative update route
router.put('/update/:id',
  verifyTokenWithSubscription,
  checkHospitalRegistration,
  authorizeRoles(['Admin']),
  updateReceptionist
);

// Delete receptionist (Admin only with subscription)
router.delete('/:id',
  verifyTokenWithSubscription,
  checkHospitalRegistration,
  authorizeRoles(['Admin']),
  deleteReceptionist
);

// Alternative delete route
router.delete('/remove/:id',
  verifyTokenWithSubscription,
  checkHospitalRegistration,
  authorizeRoles(['Admin']),
  deleteReceptionist
);

// Add these routes
router.get('/check-limit', verifyToken, checkReceptionistLimit);
router.get('/count', verifyToken, getReceptionistCount);

export default router;

