import { Request, Response } from 'express';
import { 
  runBankersSafety, 
  handleResourceRequest, 
  runDeadlockDetection, 
  analyzeRAG, 
  calculateRecoveryPlan, 
  calculateDeadlockRisk 
} from '../algorithms/index.ts';

export const algorithmController = {
  // Bankers Safety
  bankersSafety(req: Request, res: Response): void {
    try {
      const { resourceNames, processNames, totalResources, allocation, max } = req.body;

      if (!resourceNames || !processNames || !totalResources || !allocation || !max) {
        res.status(400).json({ error: 'Missing required fields: resourceNames, processNames, totalResources, allocation, max.' });
        return;
      }

      if (resourceNames.length !== totalResources.length) {
        res.status(400).json({ error: 'resourceNames and totalResources length mismatch.' });
        return;
      }

      if (processNames.length !== allocation.length || processNames.length !== max.length) {
        res.status(400).json({ error: 'processNames count does not match rows in allocation or max matrix.' });
        return;
      }

      const result = runBankersSafety({
        resourceNames,
        processNames,
        totalResources: totalResources.map(Number),
        allocation: allocation.map((r: any[]) => r.map(Number)),
        max: max.map((r: any[]) => r.map(Number)),
      });

      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error executing Banker’s safety algorithm.' });
    }
  },

  // Resource Request
  bankersRequest(req: Request, res: Response): void {
    try {
      const { resourceNames, processNames, totalResources, allocation, max, processIndex, request } = req.body;

      if (processIndex === undefined || !request || !resourceNames || !processNames || !totalResources || !allocation || !max) {
        res.status(400).json({ error: 'Missing required fields: processIndex, request, resourceNames, processNames, totalResources, allocation, max.' });
        return;
      }

      const result = handleResourceRequest({
        resourceNames,
        processNames,
        totalResources: totalResources.map(Number),
        allocation: allocation.map((r: any[]) => r.map(Number)),
        max: max.map((r: any[]) => r.map(Number)),
        processIndex: Number(processIndex),
        request: request.map(Number),
      });

      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error processing resource request.' });
    }
  },

  // Deadlock Detection
  deadlockDetection(req: Request, res: Response): void {
    try {
      const { resourceNames, processNames, available, allocation, request } = req.body;

      if (!resourceNames || !processNames || !available || !allocation || !request) {
        res.status(400).json({ error: 'Missing required fields: resourceNames, processNames, available, allocation, request.' });
        return;
      }

      const result = runDeadlockDetection({
        resourceNames,
        processNames,
        available: available.map(Number),
        allocation: allocation.map((r: any[]) => r.map(Number)),
        request: request.map((r: any[]) => r.map(Number)),
      });

      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error executing deadlock detection.' });
    }
  },

  // RAG Analysis
  ragAnalysis(req: Request, res: Response): void {
    try {
      const { nodes, edges } = req.body;

      if (!nodes || !edges) {
        res.status(400).json({ error: 'Missing nodes or edges array for RAG analysis.' });
        return;
      }

      const result = analyzeRAG({ nodes, edges });
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error analyzing Resource Allocation Graph.' });
    }
  },

  // Deadlock Recovery Plan
  deadlockRecovery(req: Request, res: Response): void {
    try {
      const { resourceNames, processNames, totalResources, allocation, max, deadlockedIndices, strategy } = req.body;

      if (!resourceNames || !processNames || !totalResources || !allocation || !max || !deadlockedIndices) {
        res.status(400).json({ error: 'Missing required fields for recovery plan.' });
        return;
      }

      const result = calculateRecoveryPlan(
        {
          resourceNames,
          processNames,
          totalResources: totalResources.map(Number),
          allocation: allocation.map((r: any[]) => r.map(Number)),
          max: max.map((r: any[]) => r.map(Number)),
          deadlockedIndices: deadlockedIndices.map(Number),
        },
        strategy || 'termination'
      );

      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error calculating recovery plan.' });
    }
  },

  // Deadlock Risk Assessment
  riskAssessment(req: Request, res: Response): void {
    try {
      const { resourceNames, processNames, totalResources, allocation, max } = req.body;

      if (!resourceNames || !processNames || !totalResources || !allocation || !max) {
        res.status(400).json({ error: 'Missing required fields for risk assessment.' });
        return;
      }

      const result = calculateDeadlockRisk({
        resourceNames,
        processNames,
        totalResources: totalResources.map(Number),
        allocation: allocation.map((r: any[]) => r.map(Number)),
        max: max.map((r: any[]) => r.map(Number)),
      });

      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error assessing deadlock risk.' });
    }
  }
};
