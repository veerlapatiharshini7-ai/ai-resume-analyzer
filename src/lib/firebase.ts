import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

// 1. Check direct client-side Vite environment variables
const clientApiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim() || '';
const clientAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || '';
const clientProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || '';
const clientStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '';
const clientMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '';
const clientAppId = import.meta.env.VITE_FIREBASE_APP_ID?.trim() || '';
const clientMeasurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() || '';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let initPromise: Promise<Firestore | null> | null = null;

const isValidConfig = (config: Partial<FirebaseWebConfig> | null | undefined): config is FirebaseWebConfig => {
  if (!config) return false;
  const k = (config.apiKey || '').trim();
  const p = (config.projectId || '').trim();
  return (
    k.length > 0 &&
    k !== 'your_firebase_api_key_here' &&
    k !== 'MY_FIREBASE_API_KEY' &&
    p.length > 0 &&
    p !== 'your_project_id'
  );
};

export const isFirebaseConfigured = (): boolean => {
  return db !== null;
};

function setupFirebaseInstance(config: FirebaseWebConfig): Firestore | null {
  try {
    const fullConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
      projectId: config.projectId,
      storageBucket: config.storageBucket || `${config.projectId}.firebasestorage.app`,
      messagingSenderId: config.messagingSenderId || '',
      appId: config.appId || '',
      measurementId: config.measurementId || undefined,
    };

    app = getApps().length === 0 ? initializeApp(fullConfig) : getApp();
    db = getFirestore(app);

    console.log(
      `%c[Firebase]%c Connected to Cloud Firestore database successfully! 🚀 (Project: %c${config.projectId}%c)`,
      'color: #f59e0b; font-weight: bold;',
      'color: #10b981; font-weight: bold;',
      'color: #3b82f6; font-weight: bold;',
      'color: inherit;'
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firebase-connected', { detail: { projectId: config.projectId } }));
    }

    return db;
  } catch (err) {
    console.error('[Firebase] Initialization error:', err);
    return null;
  }
}

// Synchronous initialization if Vite environment variables are already present
if (isValidConfig({ apiKey: clientApiKey, projectId: clientProjectId })) {
  setupFirebaseInstance({
    apiKey: clientApiKey,
    authDomain: clientAuthDomain,
    projectId: clientProjectId,
    storageBucket: clientStorageBucket,
    messagingSenderId: clientMessagingSenderId,
    appId: clientAppId,
    measurementId: clientMeasurementId,
  });
}

/**
 * Ensures Firebase is initialized by fetching server-side configuration if client vars were missing
 */
export async function getFirestoreDb(): Promise<Firestore | null> {
  if (db) return db;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Attempt to fetch from backend server /api/firebase-config
    try {
      const res = await fetch('/api/firebase-config');
      if (res.ok) {
        const data = await res.json();
        if (data.isConfigured && data.config && isValidConfig(data.config)) {
          return setupFirebaseInstance(data.config);
        }
      }
    } catch {
      // Backend not reached or offline
    }

    console.log(
      '%c[Firebase]%c Firebase credentials not detected in .env. Running in offline / local fallback mode. See FIREBASE_SETUP_GUIDE.md to connect your live Firestore database.',
      'color: #f59e0b; font-weight: bold;',
      'color: #94a3b8;'
    );
    return null;
  })();

  return initPromise;
}

// Automatically trigger background async config check on module load
if (!db && typeof window !== 'undefined') {
  getFirestoreDb();
}

export { app, db };
