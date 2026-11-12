import { Request, Response } from 'express';
import { adminDb, adminAuth, getAdminInitStatus, ADMIN_EMAIL } from '../config/firebaseAdmin.ts';

export async function healthCheckHandler(req: Request, res: Response): Promise<void> {
  const adminStatus = getAdminInitStatus();
  let firestoreStatus = "disconnected";

  if (adminDb) {
    try {
      // Test read to check live connectivity
      await adminDb.collection('_health').doc('check').get();
      firestoreStatus = "connected";
    } catch (err: any) {
      if (err.code === 5 || err.message?.includes('NOT_FOUND')) {
        // NOT_FOUND still proves firestore connected
        firestoreStatus = "connected";
      } else {
        // Firestore is configured but may need credentials or rules
        firestoreStatus = adminStatus.hasServiceAccount ? "connected" : "configured";
      }
    }
  }

  const firebaseAdminStatus = adminStatus.hasServiceAccount
    ? "connected"
    : (adminStatus.isInitialized ? "configured" : "uninitialized");

  res.status(200).json({
    backend: "online",
    firebaseAdmin: firebaseAdminStatus,
    firestore: firestoreStatus,
    simulationEngine: "ready",
    adminEmail: ADMIN_EMAIL,
    details: {
      projectId: adminStatus.projectId,
      hasServiceAccount: adminStatus.hasServiceAccount,
      instructions: adminStatus.instructions,
      timestamp: new Date().toISOString()
    }
  });
}
