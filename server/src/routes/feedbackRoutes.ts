import express from 'express';
import { feedbackController } from '../controllers/feedbackController.ts';
import { verifyFirebaseToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

// Submitting feedback requires verified Firebase authentication
router.post('/', verifyFirebaseToken, feedbackController.submitFeedback);

export default router;
