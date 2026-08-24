/**
 * Utility helper for Firestore database operations.
 * Firestore setDoc/updateDoc/addDoc fails with 'Unsupported field value: undefined'
 * if any property in an object is undefined.
 * This helper deeply sanitizes objects by stripping all undefined keys.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  return JSON.parse(JSON.stringify(data));
}
