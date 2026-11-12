import { Router } from 'express';
import { adminController } from '../controllers/adminController.ts';
import { verifyFirebaseToken, requireAdmin } from '../middleware/authMiddleware.ts';

const router = Router();

// Protect all /api/admin routes with verifyFirebaseToken and requireAdmin
router.use(verifyFirebaseToken);
router.use(requireAdmin);

// User management
router.get('/users', adminController.listUsers);
router.put('/users/:uid/status', adminController.setUserStatus);
router.delete('/users/:uid', adminController.deleteUser);

// Simulations management
router.get('/simulations', adminController.listAllSimulations);

// Feedback management
router.get('/feedback', adminController.listAllFeedback);
router.put('/feedback/:id/status', adminController.updateFeedbackStatus);
router.delete('/feedback/:id', adminController.deleteFeedback);

// Analytics & Exports
router.get('/analytics', adminController.getAnalytics);
router.get('/export/users', adminController.exportUsersCSV);
router.get('/export/simulations', adminController.exportSimulationsCSV);

export default router;
