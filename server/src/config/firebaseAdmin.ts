import * as firebaseAdminModule from 'firebase-admin';
import fs from 'fs';
import path from 'path';

export const ADMIN_EMAIL = 'jnanesh4127@gmail.com';

const admin = (firebaseAdminModule as any).default || firebaseAdminModule;

let appletConfig: any = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    appletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn("Could not load local firebase-applet-config.json:", e);
}

const projectId = process.env.FIREBASE_PROJECT_ID || appletConfig.projectId || 'gen-lang-client-0928383406';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

let isInitialized = false;
let hasServiceAccount = false;
let initError: string | null = null;

try {
  const existingApps = admin.apps || [];
  if (!existingApps.length) {
    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      isInitialized = true;
      hasServiceAccount = true;
      console.log(`[Firebase Admin] Initialized with Service Account for project: ${projectId}`);
    } else {
      admin.initializeApp({
        projectId,
      });
      isInitialized = true;
      hasServiceAccount = false;
      console.log(`[Firebase Admin] Initialized in application mode for project: ${projectId}`);
    }
  } else {
    isInitialized = true;
  }
} catch (err: any) {
  console.warn("[Firebase Admin] Initialization notice:", err.message);
  initError = err.message;
}

export const adminAuth = isInitialized && typeof admin.auth === 'function' ? admin.auth() : null;
const firestoreDbId = process.env.FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId;
export const adminDb = isInitialized && typeof admin.firestore === 'function'
  ? admin.firestore()
  : null;

export function getAdminInitStatus() {
  return {
    isInitialized,
    hasServiceAccount,
    projectId,
    initError,
    adminEmail: ADMIN_EMAIL,
    instructions: hasServiceAccount 
      ? "Firebase Admin SDK is fully authenticated with service account credentials." 
      : "For full token verification and custom claims assignment, set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in your server environment."
  };
}

export { admin };
