import { Request, Response } from 'express';
import { adminDb, adminAuth, ADMIN_EMAIL } from '../config/firebaseAdmin.ts';
import { localFeedbackStore } from './feedbackController.ts';

// In-memory fallback for user profiles
export const localUsersStore = new Map<string, any>([
  [
    'admin_seed',
    {
      uid: 'admin_seed',
      email: ADMIN_EMAIL,
      displayName: 'System Administrator',
      role: 'admin',
      disabled: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    }
  ]
]);

export const adminController = {
  // List all users
  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string || '').toLowerCase();
      const statusFilter = req.query.status as string; // 'all', 'active', 'disabled'

      let usersList: any[] = [];

      if (adminDb) {
        try {
          const snapshot = await adminDb.collection('users').get();
          usersList = snapshot.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() }));
        } catch (dbErr: any) {
          console.warn("[Admin] Firestore users read notice:", dbErr.message);
        }
      }

      if (usersList.length === 0) {
        usersList = Array.from(localUsersStore.values());
      }

      // Filter by search
      if (search) {
        usersList = usersList.filter(u => 
          (u.email || '').toLowerCase().includes(search) || 
          (u.displayName || '').toLowerCase().includes(search) ||
          (u.uid || '').toLowerCase().includes(search)
        );
      }

      // Filter by status
      if (statusFilter === 'disabled') {
        usersList = usersList.filter(u => u.disabled === true);
      } else if (statusFilter === 'active') {
        usersList = usersList.filter(u => !u.disabled);
      }

      res.status(200).json(usersList);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve users: ${err.message}` });
    }
  },

  // Toggle user disabled status
  async setUserStatus(req: Request, res: Response): Promise<void> {
    const { uid } = req.params;
    const { disabled } = req.body;

    if (disabled === undefined) {
      res.status(400).json({ error: 'Missing field: disabled (boolean).' });
      return;
    }

    try {
      if (adminAuth) {
        try {
          await adminAuth.updateUser(uid, { disabled: !!disabled });
        } catch (e: any) {
          console.warn("[Admin] adminAuth.updateUser notice:", e.message);
        }
      }

      if (adminDb) {
        try {
          await adminDb.collection('users').doc(uid).set({ disabled: !!disabled }, { merge: true });
        } catch (e: any) {
          console.warn("[Admin] adminDb updateUser status notice:", e.message);
        }
      }

      const existing = localUsersStore.get(uid);
      if (existing) {
        existing.disabled = !!disabled;
        localUsersStore.set(uid, existing);
      }

      res.status(200).json({ success: true, message: `User '${uid}' status updated to ${disabled ? 'disabled' : 'active'}.` });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to set user status: ${err.message}` });
    }
  },

  // Delete user
  async deleteUser(req: Request, res: Response): Promise<void> {
    const { uid } = req.params;

    try {
      if (adminAuth) {
        try {
          await adminAuth.deleteUser(uid);
        } catch (e: any) {
          console.warn("[Admin] adminAuth.deleteUser notice:", e.message);
        }
      }

      if (adminDb) {
        try {
          await adminDb.collection('users').doc(uid).delete();
        } catch (e: any) {
          console.warn("[Admin] adminDb.deleteUser notice:", e.message);
        }
      }

      localUsersStore.delete(uid);
      res.status(200).json({ success: true, message: `User '${uid}' deleted successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to delete user: ${err.message}` });
    }
  },

  // List all simulations across all users
  async listAllSimulations(req: Request, res: Response): Promise<void> {
    try {
      let simulations: any[] = [];
      if (adminDb) {
        try {
          const snapshot = await adminDb.collection('simulations').get();
          simulations = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          console.warn("[Admin] All simulations read notice:", e.message);
        }
      }

      res.status(200).json(simulations);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve simulations: ${err.message}` });
    }
  },

  // List all feedback
  async listAllFeedback(req: Request, res: Response): Promise<void> {
    try {
      let feedbackList: any[] = [];
      if (adminDb) {
        try {
          const snapshot = await adminDb.collection('feedback').get();
          feedbackList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          console.warn("[Admin] Feedback read notice:", e.message);
        }
      }

      if (feedbackList.length === 0) {
        feedbackList = Array.from(localFeedbackStore.values());
      }

      // Sort recent first
      feedbackList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      res.status(200).json(feedbackList);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to retrieve feedback list: ${err.message}` });
    }
  },

  // Update feedback status
  async updateFeedbackStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'reviewed', 'resolved'].includes(status)) {
      res.status(400).json({ error: "Invalid status. Allowed values: 'pending', 'reviewed', 'resolved'." });
      return;
    }

    try {
      const updates: any = {
        status,
        ...(status === 'resolved' ? { resolvedAt: new Date().toISOString() } : {})
      };

      if (adminDb) {
        try {
          await adminDb.collection('feedback').doc(id).set(updates, { merge: true });
        } catch (e: any) {
          console.warn("[Admin] Feedback update notice:", e.message);
        }
      }

      const localItem = localFeedbackStore.get(id);
      if (localItem) {
        Object.assign(localItem, updates);
        localFeedbackStore.set(id, localItem);
      }

      res.status(200).json({ success: true, message: `Feedback '${id}' marked as ${status}.` });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to update feedback: ${err.message}` });
    }
  },

  // Delete feedback
  async deleteFeedback(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      if (adminDb) {
        try {
          await adminDb.collection('feedback').doc(id).delete();
        } catch (e: any) {
          console.warn("[Admin] Feedback delete notice:", e.message);
        }
      }

      localFeedbackStore.delete(id);
      res.status(200).json({ success: true, message: `Feedback '${id}' deleted.` });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to delete feedback: ${err.message}` });
    }
  },

  // Admin Analytics
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      let usersCount = 0;
      let simsCount = 0;
      let feedbackCount = 0;
      let pendingFeedback = 0;
      let safeSims = 0;
      let unsafeSims = 0;

      if (adminDb) {
        try {
          const [uSnap, sSnap, fSnap] = await Promise.all([
            adminDb.collection('users').get(),
            adminDb.collection('simulations').get(),
            adminDb.collection('feedback').get(),
          ]);

          usersCount = uSnap.size;
          simsCount = sSnap.size;
          feedbackCount = fSnap.size;

          sSnap.docs.forEach((d: any) => {
            const data = d.data();
            if (data.isSafe) safeSims++;
            else unsafeSims++;
          });

          fSnap.docs.forEach((d: any) => {
            if (d.data().status === 'pending') pendingFeedback++;
          });
        } catch (e: any) {
          console.warn("[Admin] Analytics calculation notice:", e.message);
        }
      }

      if (usersCount === 0) usersCount = localUsersStore.size;
      if (feedbackCount === 0) {
        feedbackCount = localFeedbackStore.size;
        for (const item of localFeedbackStore.values()) {
          if (item.status === 'pending') pendingFeedback++;
        }
      }

      res.status(200).json({
        totalUsers: usersCount,
        totalSimulations: simsCount,
        totalFeedback: feedbackCount,
        pendingFeedback,
        safeSimulationsCount: safeSims,
        unsafeSimulationsCount: unsafeSims,
        recentActivity: [
          { id: '1', action: 'System Health Check executed', timestamp: new Date().toISOString(), user: 'System' },
          { id: '2', action: 'Admin security claim enforced', timestamp: new Date().toISOString(), user: ADMIN_EMAIL }
        ]
      });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to fetch analytics: ${err.message}` });
    }
  },

  // CSV Export for Users
  async exportUsersCSV(req: Request, res: Response): Promise<void> {
    try {
      let usersList: any[] = [];
      if (adminDb) {
        try {
          const snapshot = await adminDb.collection('users').get();
          usersList = snapshot.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() }));
        } catch (e: any) {}
      }
      if (usersList.length === 0) {
        usersList = Array.from(localUsersStore.values());
      }

      const headers = ['UID', 'Email', 'DisplayName', 'Role', 'Disabled', 'CreatedAt', 'LastLoginAt'];
      const rows = usersList.map(u => [
        `"${u.uid || ''}"`,
        `"${u.email || ''}"`,
        `"${u.displayName || ''}"`,
        `"${u.role || 'user'}"`,
        `"${u.disabled ? 'true' : 'false'}"`,
        `"${u.createdAt || ''}"`,
        `"${u.lastLoginAt || ''}"`,
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="deadlocksense_users.csv"');
      res.status(200).send(csvContent);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to export users CSV: ${err.message}` });
    }
  },

  // CSV Export for Simulations
  async exportSimulationsCSV(req: Request, res: Response): Promise<void> {
    try {
      let simulations: any[] = [];
      if (adminDb) {
        try {
          const snapshot = await adminDb.collection('simulations').get();
          simulations = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        } catch (e: any) {}
      }

      const headers = ['SimulationID', 'UserID', 'Title', 'Algorithm', 'IsSafe', 'SafeSequence', 'CreatedAt'];
      const rows = simulations.map(s => [
        `"${s.id || ''}"`,
        `"${s.userId || ''}"`,
        `"${s.title || ''}"`,
        `"${s.algorithm || ''}"`,
        `"${s.isSafe ? 'true' : 'false'}"`,
        `"${(s.safeSequence || []).join(' -> ')}"`,
        `"${s.createdAt || ''}"`,
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="deadlocksense_simulations.csv"');
      res.status(200).send(csvContent);
    } catch (err: any) {
      res.status(500).json({ error: `Failed to export simulations CSV: ${err.message}` });
    }
  }
};
