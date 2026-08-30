import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot as rawOnSnapshot,
  doc,
  getDoc as rawGetDoc,
  getDocs as rawGetDocs,
  setDoc as rawSetDoc,
  addDoc as rawAddDoc,
  updateDoc as rawUpdateDoc,
  deleteDoc as rawDeleteDoc,
  disableNetwork,
  enableNetwork,
  query,
  limit,
  orderBy,
  writeBatch as rawWriteBatch,
  enableMultiTabIndexedDbPersistence,
  DocumentReference,
  SetOptions,
  CollectionReference,
  UpdateData,
  WithFieldValue,
  DocumentData,
  Query
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = getFirestore(
  app,
  firebaseConfigData.firestoreDatabaseId || '(default)'
);

const getInitialQuotaState = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const quotaDate = localStorage.getItem('firestore_quota_exceeded_date');
    if (quotaDate) {
      const today = new Date().toISOString().slice(0, 10);
      if (quotaDate === today) {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
};

export let isFirestoreQuotaExceeded = getInitialQuotaState();
const quotaListeners: Array<(exceeded: boolean) => void> = [];

export function checkIsQuotaError(error: unknown): boolean {
  if (!error) return false;
  const errStr = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || '';
  return (
    errCode === 'resource-exhausted' ||
    errCode === 'firestore/resource-exhausted' ||
    errStr.includes('Quota limit exceeded') ||
    errStr.includes('Quota exceeded') ||
    errStr.includes('resource-exhausted') ||
    errStr.includes('Free daily write units') ||
    errStr.includes('Free daily read units') ||
    errStr.includes('Using maximum backoff delay') ||
    errStr.includes('quota metric')
  );
}

export function setQuotaExceededState(exceeded: boolean) {
  if (typeof window !== 'undefined') {
    try {
      if (exceeded) {
        localStorage.setItem('firestore_quota_exceeded_date', new Date().toISOString().slice(0, 10));
      } else {
        localStorage.removeItem('firestore_quota_exceeded_date');
      }
    } catch {
      // ignore
    }
  }
  isFirestoreQuotaExceeded = exceeded;
  if (exceeded) {
    disableNetwork(db).catch(() => {});
  }
  quotaListeners.forEach(fn => fn(exceeded));
}

// Enable Firestore offline persistence & immediately disable network if quota reached
if (typeof window !== 'undefined') {
  if (isFirestoreQuotaExceeded) {
    disableNetwork(db).catch(() => {});
  }
  enableMultiTabIndexedDbPersistence(db)
    .then(() => {
      if (isFirestoreQuotaExceeded) {
        disableNetwork(db).catch(() => {});
      }
    })
    .catch((err) => {
      console.warn('Firestore offline persistence could not be enabled:', err.message);
    });

  // Global unhandled promise rejection handler for quota limit
  window.addEventListener('unhandledrejection', (event) => {
    if (checkIsQuotaError(event.reason)) {
      setQuotaExceededState(true);
      event.preventDefault();
    }
  });
}

// Initialize Auth
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function onQuotaExceededChange(listener: (exceeded: boolean) => void) {
  quotaListeners.push(listener);
  // Emit current state immediately
  listener(isFirestoreQuotaExceeded);
  return () => {
    const idx = quotaListeners.indexOf(listener);
    if (idx !== -1) quotaListeners.splice(idx, 1);
  };
}

export async function reconnectFirestoreNetwork() {
  try {
    setQuotaExceededState(false);
    await enableNetwork(db);
    return true;
  } catch (err) {
    if (checkIsQuotaError(err)) {
      setQuotaExceededState(true);
      return false;
    }
    throw err;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (checkIsQuotaError(error)) {
    setQuotaExceededState(true);
    console.warn(`[Firestore Quota Limit] Operation ${operationType} on '${path}' reached quota limit. App falling back to local state.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getDeletedIds = (): string[] => {
  try {
    const data = localStorage.getItem('perangpadam_deleted_ids');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const registerDeletedId = (id: string | number) => {
  if (id === null || id === undefined) return;
  const strId = String(id).trim();
  if (!strId) return;
  try {
    const ids = getDeletedIds();
    const normalized = strId.toLowerCase();
    const hasMatch = ids.some(i => String(i).trim().toLowerCase() === normalized);
    if (!hasMatch) {
      ids.push(strId);
      localStorage.setItem('perangpadam_deleted_ids', JSON.stringify(ids));
    }
  } catch (err) {
    console.error('Error saving deleted ID to localStorage:', err);
  }
};

export const filterDeleted = <T extends Record<string, any>>(items: T[]): T[] => {
  const deletedIds = getDeletedIds();
  if (!deletedIds || deletedIds.length === 0) return items;
  
  const deletedSet = new Set(
    deletedIds.map((d) => String(d).trim().toLowerCase())
  );

  return items.filter((item) => {
    if (!item) return false;

    const keysToCheck = [
      item.id,
      item.username,
      item.kodeUlp,
      item.ulp,
      item.namaUnit,
      item.kodeUnit,
      item.namaPenyulang,
      item.kodePenyulang,
      item.sectionName,
      item.sectionId
    ];

    for (const val of keysToCheck) {
      if (val !== undefined && val !== null) {
        const strVal = String(val).trim().toLowerCase();
        if (strVal && deletedSet.has(strVal)) {
          return false;
        }
      }
    }

    return true;
  });
};

function deepSanitize<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  return JSON.parse(JSON.stringify(data));
}

export const setDoc = async <T extends DocumentData>(
  reference: DocumentReference<T>,
  data: WithFieldValue<T>,
  options?: SetOptions
) => {
  if (isFirestoreQuotaExceeded) {
    console.warn('Firestore setDoc skipped: Quota limit active');
    return;
  }
  const sanitized = deepSanitize(data);
  try {
    return options
      ? await rawSetDoc(reference, sanitized as WithFieldValue<T>, options)
      : await rawSetDoc(reference, sanitized as WithFieldValue<T>);
  } catch (err) {
    if (checkIsQuotaError(err)) {
      setQuotaExceededState(true);
      console.warn('Firestore setDoc failed due to Quota Limit Exceeded.');
      return;
    }
    throw err;
  }
};

export const addDoc = async <T extends DocumentData>(
  reference: CollectionReference<T>,
  data: WithFieldValue<T>
) => {
  if (isFirestoreQuotaExceeded) {
    console.warn('Firestore addDoc skipped: Quota limit active');
    return null as any;
  }
  const sanitized = deepSanitize(data);
  try {
    return await rawAddDoc(reference, sanitized as WithFieldValue<T>);
  } catch (err) {
    if (checkIsQuotaError(err)) {
      setQuotaExceededState(true);
      console.warn('Firestore addDoc failed due to Quota Limit Exceeded.');
      return null as any;
    }
    throw err;
  }
};

export const updateDoc = async <T extends DocumentData>(
  reference: DocumentReference<T>,
  data: UpdateData<T>
) => {
  if (isFirestoreQuotaExceeded) {
    console.warn('Firestore updateDoc skipped: Quota limit active');
    return;
  }
  const sanitized = deepSanitize(data);
  try {
    return await rawUpdateDoc(reference, sanitized as UpdateData<T>);
  } catch (err) {
    if (checkIsQuotaError(err)) {
      setQuotaExceededState(true);
      console.warn('Firestore updateDoc failed due to Quota Limit Exceeded.');
      return;
    }
    throw err;
  }
};

export const deleteDoc = async <T extends DocumentData>(
  reference: DocumentReference<T>
) => {
  if (isFirestoreQuotaExceeded) {
    console.warn('Firestore deleteDoc skipped: Quota limit active');
    return;
  }
  try {
    return await rawDeleteDoc(reference);
  } catch (err) {
    if (checkIsQuotaError(err)) {
      setQuotaExceededState(true);
      console.warn('Firestore deleteDoc failed due to Quota Limit Exceeded.');
      return;
    }
    throw err;
  }
};

export const onSnapshot = (referenceOrQuery: any, ...args: any[]): (() => void) => {
  let optionsOrObserver: any = args[0];
  let nextFn: any;
  let errorFn: any;
  let completionFn: any;

  if (typeof optionsOrObserver === 'function') {
    nextFn = optionsOrObserver;
    errorFn = args[1];
    completionFn = args[2];
  } else {
    nextFn = args[1];
    errorFn = args[2];
    completionFn = args[3];
  }

  const safeErrorFn = (err: any) => {
    if (checkIsQuotaError(err)) {
      setQuotaExceededState(true);
      console.warn('[Firestore Quota Limit] onSnapshot listener caught quota limit. App using local offline state.');
    } else if (errorFn) {
      errorFn(err);
    } else {
      console.warn('Firestore onSnapshot error:', err?.message || err);
    }
  };

  try {
    if (typeof optionsOrObserver === 'function') {
      return rawOnSnapshot(referenceOrQuery, nextFn, safeErrorFn, completionFn);
    } else {
      return rawOnSnapshot(referenceOrQuery, optionsOrObserver, nextFn, safeErrorFn, completionFn);
    }
  } catch (err) {
    if (checkIsQuotaError(err)) {
      setQuotaExceededState(true);
      console.warn('[Firestore Quota Limit] onSnapshot setup failed due to quota limit.');
    }
    return () => {};
  }
};

export const getDoc = async <T extends DocumentData>(reference: DocumentReference<T>) => {
  if (isFirestoreQuotaExceeded) {
    return { exists: () => false, data: () => undefined, id: reference.id } as any;
  }
  try {
    return await rawGetDoc(reference);
  } catch (err) {
    if (checkIsQuotaError(err)) {
      setQuotaExceededState(true);
      console.warn('Firestore getDoc caught Quota Limit.');
      return { exists: () => false, data: () => undefined, id: reference.id } as any;
    }
    throw err;
  }
};

export const getDocs = async <T extends DocumentData>(queryOrCollection: Query<T> | CollectionReference<T>) => {
  if (isFirestoreQuotaExceeded) {
    return { empty: true, docs: [], size: 0, forEach: () => {} } as any;
  }
  try {
    return await rawGetDocs(queryOrCollection);
  } catch (err) {
    if (checkIsQuotaError(err)) {
      setQuotaExceededState(true);
      console.warn('Firestore getDocs caught Quota Limit.');
      return { empty: true, docs: [], size: 0, forEach: () => {} } as any;
    }
    throw err;
  }
};

export const writeBatch = (firestoreDb: any = db) => {
  const batch = rawWriteBatch(firestoreDb || db);
  const originalCommit = batch.commit.bind(batch);
  batch.commit = async () => {
    if (isFirestoreQuotaExceeded) {
      console.warn('Firestore writeBatch.commit skipped: Quota limit active');
      return;
    }
    try {
      return await originalCommit();
    } catch (err) {
      if (checkIsQuotaError(err)) {
        setQuotaExceededState(true);
        console.warn('Firestore writeBatch commit caught Quota Limit.');
        return;
      }
      throw err;
    }
  };
  return batch;
};

export {
  collection,
  doc,
  query,
  limit,
  orderBy
};
