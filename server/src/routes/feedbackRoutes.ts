import { Router } from 'express';
import { feedbackController } from '../controllers/feedbackController.ts';
import { verifyFirebaseToken } from '../middleware/authMiddleware.ts';

const router = Router();

// Submitting feedback requires verified Firebase authentication
router.post('/', verifyFirebaseToken, feedbackController.submitFeedback);

export default router;
