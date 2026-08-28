import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  setDoc as rawSetDoc,
  addDoc as rawAddDoc,
  updateDoc as rawUpdateDoc,
  deleteDoc,
  query,
  limit,
  orderBy,
  writeBatch,
  enableMultiTabIndexedDbPersistence,
  DocumentReference,
  SetOptions,
  CollectionReference,
  UpdateData,
  WithFieldValue,
  DocumentData
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

// Enable Firestore offline persistence
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    console.warn('Firestore offline persistence could not be enabled:', err.message);
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  const sanitized = deepSanitize(data);
  return options
    ? rawSetDoc(reference, sanitized as WithFieldValue<T>, options)
    : rawSetDoc(reference, sanitized as WithFieldValue<T>);
};

export const addDoc = async <T extends DocumentData>(
  reference: CollectionReference<T>,
  data: WithFieldValue<T>
) => {
  const sanitized = deepSanitize(data);
  return rawAddDoc(reference, sanitized as WithFieldValue<T>);
};

export const updateDoc = async <T extends DocumentData>(
  reference: DocumentReference<T>,
  data: UpdateData<T>
) => {
  const sanitized = deepSanitize(data);
  return rawUpdateDoc(reference, sanitized as UpdateData<T>);
};

export {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  limit,
  orderBy,
  writeBatch
};
