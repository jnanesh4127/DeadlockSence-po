import express from 'express';
import { algorithmController } from '../controllers/algorithmController.ts';
import { verifyFirebaseToken, requireEmailAuth } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.use(verifyFirebaseToken, requireEmailAuth);

router.post('/bankers/safety', algorithmController.bankersSafety);
router.post('/bankers/request', algorithmController.bankersRequest);
router.post('/deadlock/detect', algorithmController.deadlockDetection);
router.post('/rag/analyze', algorithmController.ragAnalysis);
router.post('/deadlock/recover', algorithmController.deadlockRecovery);
router.post('/deadlock/risk-assessment', algorithmController.riskAssessment);

export default router;
