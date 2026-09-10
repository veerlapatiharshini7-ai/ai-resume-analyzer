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
import { HistoricalInterviewRecord } from '../types';

const COLLECTION_NAME = 'interview_sessions';
const LOCAL_STORAGE_KEY = 'ai_resume_interview_history_v1';
const MAX_STORED_SESSIONS = 100;

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
function getLocalInterviewHistory(): HistoricalInterviewRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_STORED_SESSIONS);
    }
  } catch (e) {
    console.warn('[Storage] Failed to read local interview history:', e);
  }
  return [];
}

function saveLocalInterviewHistory(records: HistoricalInterviewRecord[]): void {
  try {
    const trimmed = records.slice(0, MAX_STORED_SESSIONS);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(
      new CustomEvent('interview-history-updated', { detail: { count: trimmed.length } })
    );
  } catch (e) {
    console.warn('[Storage] Failed to save local interview history:', e);
  }
}

/**
 * Save completed mock interview session to Cloud Firestore and LocalStorage
 */
export async function saveInterviewSessionToFirestore(
  record: HistoricalInterviewRecord
): Promise<boolean> {
  // Update local storage immediately for fast reactive UI
  const existing = getLocalInterviewHistory().filter((r) => r.id !== record.id);
  const updated = [record, ...existing];
  saveLocalInterviewHistory(updated);

  const db = await getFirestoreDb();

  if (!db) {
    console.log(
      `%c[Firestore (Local Fallback)]%c Saved mock interview session "${record.targetRole}" (${record.overallScore}/100) to localStorage. (Firebase not configured in .env)`,
      'color: #8b5cf6; font-weight: bold;',
      'color: inherit;'
    );
    return true;
  }

  try {
    console.log(
      `%c[Firestore]%c Saving interview session to collection "%c${COLLECTION_NAME}%c" (Doc ID: ${record.id})...`,
      'color: #f59e0b; font-weight: bold;',
      'color: inherit;',
      'color: #8b5cf6; font-weight: bold;',
      'color: inherit;'
    );

    const docRef = doc(db, COLLECTION_NAME, record.id);
    const rawPayload = {
      ...record,
      createdAt: Date.now(),
      updatedAt: new Date().toISOString(),
    };

    // Sanitize payload to remove any undefined fields before calling setDoc
    const payload = sanitizeForFirestore(rawPayload);

    await setDoc(docRef, payload, { merge: true });

    console.log(
      `%c[Firestore]%c ✅ Mock interview record for %c${record.targetRole}%c (Score: ${record.overallScore}/100) successfully saved to Cloud Firestore!`,
      'color: #10b981; font-weight: bold;',
      'color: inherit;',
      'color: #8b5cf6; font-weight: bold;',
      'color: inherit;'
    );
    return true;
  } catch (error) {
    console.error('[Firestore] Error saving interview record to Firestore:', error);
    return false;
  }
}

/**
 * Real-time listener for interview sessions from Firestore with automatic LocalStorage sync
 */
export function subscribeInterviewSessions(
  onUpdate: (records: HistoricalInterviewRecord[]) => void
): Unsubscribe {
  const cached = getLocalInterviewHistory();
  if (cached.length > 0) {
    onUpdate(cached);
  }

  let activeUnsubscribe: Unsubscribe = () => {};

  const setupListener = async () => {
    const db = await getFirestoreDb();

    if (!db) {
      console.log(
        `%c[Firestore]%c Interview history using local cache (${cached.length} records). Configure .env for Cloud Firestore sync.`,
        'color: #8b5cf6; font-weight: bold;',
        'color: inherit;'
      );
      return;
    }

    try {
      console.log(
        `%c[Firestore]%c Subscribing to real-time updates for "%c${COLLECTION_NAME}%c"...`,
        'color: #f59e0b; font-weight: bold;',
        'color: inherit;',
        'color: #8b5cf6; font-weight: bold;',
        'color: inherit;'
      );

      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(MAX_STORED_SESSIONS)
      );

      activeUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const records: HistoricalInterviewRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as HistoricalInterviewRecord;
            if (data && data.id && typeof data.overallScore === 'number') {
              records.push({
                ...data,
                id: data.id || docSnap.id,
              });
            }
          });

          console.log(
            `%c[Firestore]%c 🔄 Synced %c${records.length}%c interview sessions from Cloud Firestore.`,
            'color: #10b981; font-weight: bold;',
            'color: inherit;',
            'color: #8b5cf6; font-weight: bold;',
            'color: inherit;'
          );

          saveLocalInterviewHistory(records);
          onUpdate(records);
        },
        (error) => {
          console.warn('[Firestore] Snapshot listener for interviews fell back to unsorted query:', error);
          fetchInterviewsFallback(onUpdate);
        }
      );
    } catch (error) {
      console.error('[Firestore] Error creating interview listener:', error);
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
 * Fallback fetch for interviews if index is missing
 */
async function fetchInterviewsFallback(onUpdate: (records: HistoricalInterviewRecord[]) => void) {
  const db = await getFirestoreDb();
  if (!db) return;
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    const records: HistoricalInterviewRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as HistoricalInterviewRecord;
      if (data && data.id && typeof data.overallScore === 'number') {
        records.push({
          ...data,
          id: data.id || docSnap.id,
        });
      }
    });
    saveLocalInterviewHistory(records);
    onUpdate(records);
  } catch (err) {
    console.error('[Firestore] Fallback interview query failed:', err);
  }
}

/**
 * Delete a single interview record
 */
export async function deleteInterviewSessionFromFirestore(id: string): Promise<boolean> {
  const localList = getLocalInterviewHistory().filter((r) => r.id !== id);
  saveLocalInterviewHistory(localList);

  const db = await getFirestoreDb();
  if (!db) {
    console.log(`[Firestore (Local)] Deleted interview record "${id}".`);
    return true;
  }

  try {
    console.log(`[Firestore] Deleting interview session "${id}" from Cloud Firestore...`);
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    console.log(`[Firestore] ✅ Deleted interview session "${id}" successfully.`);
    return true;
  } catch (error) {
    console.error(`[Firestore] Error deleting interview session "${id}":`, error);
    return false;
  }
}

/**
 * Clear all interview records
 */
export async function clearAllInterviewSessionsFromFirestore(): Promise<boolean> {
  saveLocalInterviewHistory([]);

  const db = await getFirestoreDb();
  if (!db) {
    console.log('[Firestore (Local)] Cleared all interview records.');
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
    console.log('[Firestore] ✅ All interview sessions cleared from Cloud Firestore.');
    return true;
  } catch (error) {
    console.error('[Firestore] Error clearing interview records:', error);
    return false;
  }
}
