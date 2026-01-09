import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { createHash } from 'crypto';

// Define the "special" types that should not be deep-partialized
type SpecialTypes =
  | Date
  | FirebaseFirestore.Timestamp
  | FirebaseFirestore.GeoPoint
  | FirebaseFirestore.DocumentReference<unknown>;

// Now use it in DeepPartial
export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
  ? _DeepPartialArray<U>
  : T extends SpecialTypes // 👈 keep these intact
  ? T | undefined
  : T extends object
  ? _DeepPartialObject<T>
  : T | undefined;

type _DeepPartialArray<T> = Array<DeepPartial<T>>;
type _DeepPartialObject<T> = { [P in keyof T]?: DeepPartial<T[P]> };

type FirestoreSentinel = FieldValue | Timestamp;
// Deeply partial and allows sentinel values (increment, arrayUnion, etc.)
export type FirestoreUpdate<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? FirestoreSentinel | Array<FirestoreUpdate<U>>
    : T[P] extends object
    ? FirestoreSentinel | FirestoreUpdate<T[P]>
    : T[P] | FirestoreSentinel;
};

/**
 * Recursively flattens a nested object into a dot-notation object,
 * preserving FieldValue instances.
 * @param obj The object to flatten.
 * @param path The current path prefix for dot notation.
 * @param res The accumulated flattened object.
 * @returns A flattened object with dot-notation keys.
 */
export type FlattenedResult = { [key: string]: any };

export function flattenForFirestoreUpdate(obj: any, path: string = '', res: FlattenedResult = {}): FlattenedResult {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const currentPath = path ? path + '.' + key : key;
      const value = obj[key];
      if (value === null) res[currentPath] = null;
      else if (value instanceof FieldValue) res[currentPath] = value;
      else if (value instanceof Timestamp) res[currentPath] = value;
      else if (Array.isArray(value)) res[currentPath] = value;
      else if (typeof value !== 'object') res[currentPath] = value;
      else flattenForFirestoreUpdate(value, currentPath, res);
    }
  }
  return res;
}

/**
 * Simple shallow diff for logging changes.
 */
export function getDiff(oldData: any, newData: any): any {
  const diff: any = {};
  for (const key in newData) {
    // Simple stringify check for nested objects
    const oldStr = JSON.stringify(oldData[key]);
    const newStr = JSON.stringify(newData[key]);
    if (oldStr !== newStr) {
      diff[key] = { old: oldData[key], new: newData[key] };
    }
  }
  return diff;
}

export function createDataHash(data: any): string {
  // Create deterministic JSON string
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  // Generate SHA-256 hash
  return createHash('sha256').update(jsonString).digest('hex');
}

// TOOD: JR remove this file in future
