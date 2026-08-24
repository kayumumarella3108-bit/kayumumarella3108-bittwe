// IndexedDB Offline Queue & Connection Sync Manager
export interface OfflineQueueItem {
  id?: number;
  type: string; // 'add_penyulang' | 'update_penyulang' | 'add_gangguan' | 'add_pengukuran' | 'generic'
  data: any;
  timestamp: number;
}

const DB_NAME = 'PapedaOfflineDB';
const STORE_NAME = 'offlineQueue';
const DB_VERSION = 1;

export const openOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const addToOfflineQueue = async (type: string, data: any): Promise<void> => {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const req = store.add({ type, data, timestamp: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    window.dispatchEvent(new Event('papeda-offline-queue-updated'));
  } catch (err) {
    console.error('Failed to save to offline IndexedDB queue:', err);
    // Fallback to localStorage if IDB fails
    try {
      const existing = JSON.parse(localStorage.getItem('papeda_offline_queue') || '[]');
      existing.push({ type, data, timestamp: Date.now() });
      localStorage.setItem('papeda_offline_queue', JSON.stringify(existing));
      window.dispatchEvent(new Event('papeda-offline-queue-updated'));
    } catch (e) {
      console.error('LocalStorage fallback also failed:', e);
    }
  }
};

export const getOfflineQueue = async (): Promise<OfflineQueueItem[]> => {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return await new Promise<OfflineQueueItem[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to read offline IndexedDB queue, checking localStorage:', err);
    try {
      return JSON.parse(localStorage.getItem('papeda_offline_queue') || '[]');
    } catch (e) {
      return [];
    }
  }
};

export const clearOfflineQueue = async (): Promise<void> => {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    localStorage.removeItem('papeda_offline_queue');
    window.dispatchEvent(new Event('papeda-offline-queue-updated'));
  } catch (err) {
    console.error('Failed to clear offline queue:', err);
    localStorage.removeItem('papeda_offline_queue');
    window.dispatchEvent(new Event('papeda-offline-queue-updated'));
  }
};
