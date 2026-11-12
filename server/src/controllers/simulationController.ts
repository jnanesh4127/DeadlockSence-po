import { Request, Response } from 'express';
import { adminDb } from '../config/firebaseAdmin.ts';

// In-memory backing store for local fallback/cache
const localSimulationsStore = new Map<string, any>();

export const simulationController = {
  // Get simulations for authenticated user
  async listUserSimulations(req: Request, res: Response): Promise<void> {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    try {
      if (adminDb) {
        try {
          const snapshot = await adminDb.collection('simulations')
            .where('userId', '==', userId)
            .get();

          const simulations = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          }));
          res.status(200).json(simulations);
          return;
        } catch (dbErr: any) {
          console.warn("[Simulations] Firestore query notice:", dbErr.message);
        }
      }

      // Local fallback
      const userSims = Array.from(localSimulationsStore.values()).filter(s => s.userId === userId);
      res.status(200).json(userSims);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve simulations: ${err.message}` });
    }
  },

  // Create new simulation
  async createSimulation(req: Request, res: Response): Promise<void> {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    const { title, algorithm, resourceNames, processNames, totalResources, allocation, max, request, isSafe, safeSequence, description } = req.body;

    if (!title || !algorithm) {
      res.status(400).json({ error: 'Missing required simulation fields: title and algorithm.' });
      return;
    }

    const simId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newSimulation = {
      id: simId,
      userId,
      title,
      description: description || '',
      algorithm,
      resourceNames: resourceNames || ['R1', 'R2', 'R3'],
      processNames: processNames || ['P0', 'P1', 'P2'],
      totalResources: totalResources || [10, 5, 7],
      allocation: allocation || [[0, 1, 0], [2, 0, 0], [3, 0, 2]],
      max: max || [[7, 5, 3], [3, 2, 2], [9, 0, 2]],
      request: request || [],
      isSafe: isSafe ?? true,
      safeSequence: safeSequence || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (adminDb) {
        try {
          await adminDb.collection('simulations').doc(simId).set(newSimulation);
        } catch (dbErr: any) {
          console.warn("[Simulations] Firestore write notice:", dbErr.message);
        }
      }
      localSimulationsStore.set(simId, newSimulation);
      res.status(201).json(newSimulation);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to save simulation: ${err.message}` });
    }
  },

  // Get simulation by ID
  async getSimulationById(req: Request, res: Response): Promise<void> {
    const userId = req.user?.uid;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    try {
      let simData: any = null;

      if (adminDb) {
        try {
          const docSnap = await adminDb.collection('simulations').doc(id).get();
          if (docSnap.exists) {
            simData = { id: docSnap.id, ...docSnap.data() };
          }
        } catch (dbErr: any) {
          console.warn("[Simulations] Firestore get notice:", dbErr.message);
        }
      }

      if (!simData) {
        simData = localSimulationsStore.get(id);
      }

      if (!simData) {
        res.status(404).json({ error: `Simulation with ID '${id}' not found.` });
        return;
      }

      // Check ownership
      if (simData.userId !== userId && !req.user?.admin) {
        res.status(403).json({ error: 'Forbidden: You do not own this simulation record.' });
        return;
      }

      res.status(200).json(simData);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve simulation: ${err.message}` });
    }
  },

  // Update simulation
  async updateSimulation(req: Request, res: Response): Promise<void> {
    const userId = req.user?.uid;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    try {
      let existingSim: any = null;
      if (adminDb) {
        try {
          const docSnap = await adminDb.collection('simulations').doc(id).get();
          if (docSnap.exists) {
            existingSim = docSnap.data();
          }
        } catch (dbErr: any) {
          console.warn("[Simulations] Firestore read notice:", dbErr.message);
        }
      }

      if (!existingSim) {
        existingSim = localSimulationsStore.get(id);
      }

      if (!existingSim) {
        res.status(404).json({ error: `Simulation with ID '${id}' not found.` });
        return;
      }

      if (existingSim.userId !== userId && !req.user?.admin) {
        res.status(403).json({ error: 'Forbidden: You do not own this simulation record.' });
        return;
      }

      const updated = {
        ...existingSim,
        ...req.body,
        id,
        userId: existingSim.userId, // immutable owner
        updatedAt: new Date().toISOString()
      };

      if (adminDb) {
        try {
          await adminDb.collection('simulations').doc(id).set(updated, { merge: true });
        } catch (dbErr: any) {
          console.warn("[Simulations] Firestore update notice:", dbErr.message);
        }
      }

      localSimulationsStore.set(id, updated);
      res.status(200).json(updated);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to update simulation: ${err.message}` });
    }
  },

  // Delete simulation
  async deleteSimulation(req: Request, res: Response): Promise<void> {
    const userId = req.user?.uid;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    try {
      let existingSim: any = null;
      if (adminDb) {
        try {
          const docSnap = await adminDb.collection('simulations').doc(id).get();
          if (docSnap.exists) {
            existingSim = docSnap.data();
          }
        } catch (dbErr: any) {
          console.warn("[Simulations] Firestore read notice:", dbErr.message);
        }
      }

      if (!existingSim) {
        existingSim = localSimulationsStore.get(id);
      }

      if (!existingSim) {
        res.status(404).json({ error: `Simulation with ID '${id}' not found.` });
        return;
      }

      if (existingSim.userId !== userId && !req.user?.admin) {
        res.status(403).json({ error: 'Forbidden: You do not own this simulation record.' });
        return;
      }

      if (adminDb) {
        try {
          await adminDb.collection('simulations').doc(id).delete();
        } catch (dbErr: any) {
          console.warn("[Simulations] Firestore delete notice:", dbErr.message);
        }
      }

      localSimulationsStore.delete(id);
      res.status(200).json({ success: true, message: `Simulation '${id}' successfully deleted.` });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to delete simulation: ${err.message}` });
    }
  }
};
