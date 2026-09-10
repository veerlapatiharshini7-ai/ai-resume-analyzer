import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb, isFirebaseConfigured } from '../lib/firebase';
import { ResumeHistoryItem } from '../types';

const COLLECTION_NAME = 'resume_analyses';
const LOCAL_STORAGE_KEY = 'resume_history';
const MAX_STORED_ITEMS = 30;

/**
 * Strips all `undefined` values recursively so Firestore never rejects documents
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj as T;
}

/**
 * Fallback helpers for LocalStorage persistence
 */
function getLocalResumeHistory(): ResumeHistoryItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_STORED_ITEMS);
    }
  } catch (e) {
    console.warn('[Storage] Failed to read local resume history:', e);
  }
  return [];
}

function saveLocalResumeHistory(items: ResumeHistoryItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_STORED_ITEMS)));
  } catch (e) {
    console.warn('[Storage] Failed to save local resume history:', e);
  }
}

/**
 * Save an analyzed resume audit to Firestore database (with LocalStorage backup)
 */
export async function saveResumeAnalysis(item: ResumeHistoryItem): Promise<boolean> {
  // Always update local cache first for instant UI response
  const localList = getLocalResumeHistory().filter((i) => i.id !== item.id);
  saveLocalResumeHistory([item, ...localList]);

  const db = await getFirestoreDb();

  if (!db) {
    console.log(
      `%c[Firestore (Local Fallback)]%c Saved resume audit "${item.fileName}" to localStorage. (Firebase not configured in .env)`,
      'color: #3b82f6; font-weight: bold;',
      'color: inherit;'
    );
    return true;
  }

  try {
    console.log(
      `%c[Firestore]%c Saving resume analysis to collection "%c${COLLECTION_NAME}%c" (Doc ID: ${item.id})...`,
      'color: #f59e0b; font-weight: bold;',
      'color: inherit;',
      'color: #3b82f6; font-weight: bold;',
      'color: inherit;'
    );

    const docRef = doc(db, COLLECTION_NAME, item.id);
    const rawPayload = {
      ...item,
      createdAt: Date.now(),
      updatedAt: new Date().toISOString(),
    };

    // Sanitize payload to remove any undefined fields before calling setDoc
    const payload = sanitizeForFirestore(rawPayload);

    await setDoc(docRef, payload, { merge: true });

    console.log(
      `%c[Firestore]%c ✅ Resume audit "%c${item.fileName}%c" (Score: ${item.atsScore}/100) successfully saved to Cloud Firestore!`,
      'color: #10b981; font-weight: bold;',
      'color: inherit;',
      'color: #3b82f6; font-weight: bold;',
      'color: inherit;'
    );
    return true;
  } catch (error) {
    console.error('[Firestore] Error saving resume analysis to Firestore:', error);
    return false;
  }
}

/**
 * Real-time listener for resume history from Firestore with automatic LocalStorage sync
 */
export function subscribeResumeHistory(
  onUpdate: (items: ResumeHistoryItem[]) => void
): Unsubscribe {
  // Immediately provide cached local items
  const cached = getLocalResumeHistory();
  if (cached.length > 0) {
    onUpdate(cached);
  }

  let activeUnsubscribe: Unsubscribe = () => {};

  const setupListener = async () => {
    const db = await getFirestoreDb();

    if (!db) {
      console.log(
        `%c[Firestore]%c Real-time listener using local cache (${cached.length} items). Configure .env for Cloud Firestore sync.`,
        'color: #f59e0b; font-weight: bold;',
        'color: inherit;'
      );
      return;
    }

    try {
      console.log(
        `%c[Firestore]%c Subscribing to real-time updates for "%c${COLLECTION_NAME}%c"...`,
        'color: #f59e0b; font-weight: bold;',
        'color: inherit;',
        'color: #3b82f6; font-weight: bold;',
        'color: inherit;'
      );

      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(MAX_STORED_ITEMS)
      );

      activeUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: ResumeHistoryItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as any;
            items.push({
              id: data.id || docSnap.id,
              fileName: data.fileName || 'Uploaded_Resume.pdf',
              date: data.date || new Date().toLocaleDateString(),
              atsScore: typeof data.atsScore === 'number' ? data.atsScore : 0,
              result: data.result || null,
            });
          });

          console.log(
            `%c[Firestore]%c 🔄 Synced %c${items.length}%c resume audits from Cloud Firestore.`,
            'color: #10b981; font-weight: bold;',
            'color: inherit;',
            'color: #3b82f6; font-weight: bold;',
            'color: inherit;'
          );

          saveLocalResumeHistory(items);
          onUpdate(items);
        },
        (error) => {
          console.warn('[Firestore] Snapshot listener for resumes fell back to unindexed query:', error);
          fetchResumesFallback(onUpdate);
        }
      );
    } catch (error) {
      console.error('[Firestore] Error creating resume listener:', error);
    }
  };

  setupListener();

  const handleFirebaseConnected = () => {
    activeUnsubscribe();
    setupListener();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('firebase-connected', handleFirebaseConnected);
  }

  return () => {
    activeUnsubscribe();
    if (typeof window !== 'undefined') {
      window.removeEventListener('firebase-connected', handleFirebaseConnected);
    }
  };
}

/**
 * Fallback query without orderBy index requirement
 */
async function fetchResumesFallback(onUpdate: (items: ResumeHistoryItem[]) => void) {
  const db = await getFirestoreDb();
  if (!db) return;
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    const items: ResumeHistoryItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      items.push({
        id: data.id || docSnap.id,
        fileName: data.fileName || 'Uploaded_Resume.pdf',
        date: data.date || new Date().toLocaleDateString(),
        atsScore: typeof data.atsScore === 'number' ? data.atsScore : 0,
        result: data.result || null,
      });
    });
    saveLocalResumeHistory(items);
    onUpdate(items);
  } catch (err) {
    console.error('[Firestore] Fallback query failed:', err);
  }
}

/**
 * Delete a single resume analysis document by ID
 */
export async function deleteResumeAnalysis(id: string): Promise<boolean> {
  const localList = getLocalResumeHistory().filter((i) => i.id !== id);
  saveLocalResumeHistory(localList);

  const db = await getFirestoreDb();
  if (!db) {
    console.log(`[Firestore (Local)] Deleted resume audit "${id}".`);
    return true;
  }

  try {
    console.log(`[Firestore] Deleting resume audit "${id}" from Cloud Firestore...`);
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    console.log(`[Firestore] ✅ Deleted resume audit "${id}" successfully.`);
    return true;
  } catch (error) {
    console.error(`[Firestore] Error deleting resume audit "${id}":`, error);
    return false;
  }
}

/**
 * Clear all resume analyses from Firestore and LocalStorage
 */
export async function clearAllResumeAnalyses(): Promise<boolean> {
  saveLocalResumeHistory([]);

  const db = await getFirestoreDb();
  if (!db) {
    console.log('[Firestore (Local)] Cleared all resume audits.');
    return true;
  }

  try {
    console.log(`[Firestore] Clearing all documents in "${COLLECTION_NAME}"...`);
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    console.log('[Firestore] ✅ All resume audits cleared from Cloud Firestore.');
    return true;
  } catch (error) {
    console.error('[Firestore] Error clearing resume audits:', error);
    return false;
  }
}
