import express from 'express';
import cors from 'cors';
import { healthCheckHandler } from './controllers/healthController.ts';
import algorithmRoutes from './routes/algorithmRoutes.ts';
import simulationRoutes from './routes/simulationRoutes.ts';
import feedbackRoutes from './routes/feedbackRoutes.ts';
import adminRoutes from './routes/adminRoutes.ts';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check endpoint (Phase 14)
  app.get('/api/healthCheck', healthCheckHandler);

  // Core API Modules
  app.use('/api/algorithms', algorithmRoutes);
  app.use('/api/simulations', simulationRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint '${req.originalUrl}' not found.` });
  });

  return app;
}
