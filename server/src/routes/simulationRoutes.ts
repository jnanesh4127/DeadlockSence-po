import express from 'express';
import { simulationController } from '../controllers/simulationController.ts';
import { verifyFirebaseToken } from '../middleware/authMiddleware.ts';

const router = express.Router();

// All simulation routes require verified Firebase token
router.use(verifyFirebaseToken);

router.get('/', simulationController.listUserSimulations);
router.post('/', simulationController.createSimulation);
router.get('/:id', simulationController.getSimulationById);
router.put('/:id', simulationController.updateSimulation);
router.delete('/:id', simulationController.deleteSimulation);

export default router;
