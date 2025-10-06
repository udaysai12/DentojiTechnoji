// // routes/hostDashboardRoutes.js
// import express from 'express';
// import {
//   getDashboardData,
//   getDashboardStats,
//   getDashboardHeaderStats,
//   getDoctorDetails,
//   deleteDoctor
// } from '../controllers/hostDashboardController.js';
// import { authenticateToken } from '../middleware/authMiddleware.js';

// const router = express.Router();

// /**
//  * @route   GET /api/host/dashboard
//  * @desc    Get all doctors/clinics dashboard data with pagination
//  * @access  Protected (requires authentication)
//  * @query   page (optional) - Page number (default: 1)
//  * @query   limit (optional) - Records per page (default: 50)
//  * @query   search (optional) - Search term for filtering
//  * @query   sortBy (optional) - Field to sort by (default: 'startDate')
//  * @query   sortOrder (optional) - Sort order 'asc' or 'desc' (default: 'desc')
//  */
// router.get('/dashboard', authenticateToken, getDashboardData);

// /**
//  * @route   GET /api/host/dashboard/stats
//  * @desc    Get dashboard statistics (total, active, inactive counts)
//  * @access  Protected (requires authentication)
//  */
// router.get('/dashboard/stats', authenticateToken, getDashboardStats);

// /**
//  * @route   GET /api/host/dashboard/doctor/:doctorId
//  * @desc    Get detailed information for a specific doctor
//  * @access  Protected (requires authentication)
//  */
// router.get('/dashboard/doctor/:doctorId', authenticateToken, getDoctorDetails);

// /**
//  * @route   DELETE /api/host/dashboard/doctor/:doctorId
//  * @desc    Delete a doctor and all associated data
//  * @access  Protected (requires authentication)
//  * @warning This is a destructive operation
//  */
// router.delete('/dashboard/doctor/:doctorId', authenticateToken, deleteDoctor);

// router.get('/dashboard/header-stats', authenticateToken, getDashboardHeaderStats);

// export default router;


// routes/hostDashboardRoutes.js
import express from 'express';
import {
  getDashboardData,
  getDashboardStats,
  getDashboardHeaderStats,
  getDoctorDetails,
  deleteDoctor
} from '../controllers/hostDashboardController.js';
import hostAuthMiddleware from '../middleware/hostAuth.js';

const router = express.Router();

// All routes use hostAuthMiddleware instead of authenticateToken
router.get('/dashboard', hostAuthMiddleware, getDashboardData);
router.get('/dashboard/stats', hostAuthMiddleware, getDashboardStats);
router.get('/dashboard/header-stats', hostAuthMiddleware, getDashboardHeaderStats);
router.get('/dashboard/doctor/:doctorId', hostAuthMiddleware, getDoctorDetails);
router.delete('/dashboard/doctor/:doctorId', hostAuthMiddleware, deleteDoctor);

export default router;