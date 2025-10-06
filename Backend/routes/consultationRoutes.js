// import express from 'express';
// import {
//   createConsultation,
//   getConsultations,
//   getConsultationById,
//   updateConsultation,
//   deleteConsultation,
//   searchPatientsForConsultation,
//   testConsultation,
//   updatePayment,
//   getUpcomingConsultations,
//   getPendingPayments,
//   getConsultationStats
// } from '../controllers/consultationController.js';
// import { verifyToken } from '../middleware/authMiddleware.js';

// const router = express.Router();

// // Apply authentication middleware to all routes
// router.use(verifyToken);

// // Test endpoint
// router.post('/test', testConsultation);

// // Statistics endpoints (place before parameterized routes)
// router.get('/stats', getConsultationStats);
// router.get('/upcoming', getUpcomingConsultations);
// router.get('/pending-payments', getPendingPayments);

// // Patient search endpoint
// router.get('/search-patients', searchPatientsForConsultation);

// // Main CRUD operations
// router.post('/', createConsultation);                    // Create new consultation
// router.get('/', getConsultations);                       // Get all consultations with filtering/pagination
// router.get('/:id', getConsultationById);                 // Get single consultation
// router.put('/:id', updateConsultation);                  // Update consultation
// router.delete('/:id', deleteConsultation);               // Delete consultation

// // Payment management route
// router.put('/:id/payment', updatePayment);               // Update payment information

// export default router;


// import express from 'express';
// import {
//   testConsultation,
//   createConsultation,
//   getConsultations,
//   getConsultationById,
//   updateConsultation,
//   updatePayment, // Make sure this is imported
//   deleteConsultation,
//   searchPatientsForConsultation,
//   getUpcomingConsultations,
//   getPendingPayments,
//   getConsultationStats
// } from '../controllers/consultationController.js';
// import { authenticate } from '../middleware/authMiddleware.js';

// const router = express.Router();

// // Test endpoint
// router.get('/test', testConsultation);

// // Search patients for consultation
// router.get('/search-patients', authenticate, searchPatientsForConsultation);

// // Get consultation statistics
// router.get('/stats', authenticate, getConsultationStats);

// // Get upcoming consultations
// router.get('/upcoming', authenticate, getUpcomingConsultations);

// // Get pending payments
// router.get('/pending-payments', authenticate, getPendingPayments);

// // Get all consultations with filtering
// router.get('/', authenticate, getConsultations);

// // Get consultation by ID
// router.get('/:id', authenticate, getConsultationById);

// // Create new consultation
// router.post('/', authenticate, createConsultation);

// // Update consultation
// router.put('/:id', authenticate, updateConsultation);

// // Update payment information - CRITICAL ROUTE
// router.put('/:id/payment', authenticate, updatePayment);

// // Delete consultation
// router.delete('/:id', authenticate, deleteConsultation);

// export default router;

import express from 'express';
import {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultation,
  deleteConsultation,
  searchPatientsForConsultation,
  testConsultation,
  updatePayment, // Make sure this is imported
  getUpcomingConsultations,
  getPendingPayments,
  getConsultationStats
} from '../controllers/consultationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Test endpoint
router.post('/test', testConsultation);

// Statistics endpoints (place before parameterized routes)
router.get('/stats', getConsultationStats);
router.get('/upcoming', getUpcomingConsultations);
router.get('/pending-payments', getPendingPayments);

// Patient search endpoint
router.get('/search-patients',verifyToken, searchPatientsForConsultation);

// Main CRUD operations
router.post('/',  createConsultation);                    // Create new consultation
router.get('/',verifyToken, getConsultations);                       // Get all consultations with filtering/pagination
router.get('/:id',verifyToken, getConsultationById);                 // Get single consultation
router.put('/:id', updateConsultation);                  // Update consultation
router.delete('/:id', deleteConsultation);               // Delete consultation

// Payment management route - CRITICAL ROUTE
router.put('/:id/payment', updatePayment);               // Update payment information

export default router;