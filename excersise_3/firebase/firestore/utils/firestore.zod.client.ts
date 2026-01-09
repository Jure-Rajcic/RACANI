// src/utils/firestore.zod.ts
import { z } from 'zod';
import {
  Timestamp,
  GeoPoint,
  DocumentReference,
  QueryDocumentSnapshot,
  DocumentData,
  FieldValue,
} from 'firebase/firestore';

// --- 1. SCHEMAS ---

// Public constructors
export const FirestoreTimestampSchema = z.instanceof(Timestamp);
export const FirestoreGeoPointSchema = z.instanceof(GeoPoint);
export const FirestoreBytesSchema = z.instanceof(Uint8Array);

// Private constructors (using z.custom)
export const FirestoreRefSchema = z.custom<DocumentReference>(v => v instanceof DocumentReference);
export const FieldValueSchema = z.custom<FieldValue>(v => v instanceof FieldValue);

// --- 2. CONVERTER FACTORY ---

export const DOC_VERSION = 'DOC_VERSION';
export const DOC_VERSION_V1 = 'V1';
export const DOC_TYPE_CREATE = 'CREATE';
export const DOC_CREATED_AT = 'DOC_CREATED_AT';
export const DOC_TYPE_UPDATE = 'UPDATE';
export const DOC_UPDATED_AT = 'DOC_UPDATED_AT';
export const DOC_TYPE_DELETE = 'DELETE';
export const DOC_DELETED_AT = 'DOC_DELETED_AT';
export const DOC_OPERATION = 'DOC_OPERATION';
export type DOC_OPERATION_TYPE = typeof DOC_TYPE_CREATE | typeof DOC_TYPE_UPDATE | typeof DOC_TYPE_DELETE;

/** Custom converter interface that matches what Firestore expects */
export interface ZodConverter<T> {
  toFirestore(model: T): DocumentData;
  fromFirestore(snapshot: QueryDocumentSnapshot): T;
}

/**
 * Creates type-safe Firestore converters for V1 documents.
 *
 * - toFirestore: Adds DOC_VERSION and timestamps automatically
 * - fromFirestore: Strips metadata, validates with Zod, returns only your fields T
 *
 * @param schema - Your Zod schema (only YOUR fields, no base fields)
 * @returns Object with read, create, update, delete converters
 *
 * @example
 * const CandidateStats1Schema = z.object({
 *   DATE_ENROLLED: FirestoreTimestampSchema,
 *   CATEGORY: z.string(),
 * });
 * type CandidateStats1 = z.infer<typeof CandidateStats1Schema>;
 *
 * const converters = zodConvertersV1(CandidateStats1Schema);
 * const collection = db.collection('stats').withConverter(converters.create);
 */
export const zodConvertersV1 = <T extends DocumentData>(schema: z.ZodType<T>) => {
  const stripMetadata = (doc: DocumentData): T => {
    const { [DOC_VERSION]: _, [DOC_CREATED_AT]: __, [DOC_UPDATED_AT]: ___, [DOC_DELETED_AT]: ____, ...model } = doc;
    return schema.parse(model);
  };

  const read: ZodConverter<T> = {
    toFirestore(model: T): DocumentData {
      return {
        ...model,
        [DOC_VERSION]: DOC_VERSION_V1,
        [DOC_CREATED_AT]: null,
        [DOC_UPDATED_AT]: null,
        [DOC_DELETED_AT]: null,
      };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return stripMetadata(snapshot.data());
    },
  };

  const create: ZodConverter<T> = {
    toFirestore(model: T): DocumentData {
      const timestamp = Timestamp.now();
      return {
        ...model,
        [DOC_VERSION]: DOC_VERSION_V1,
        [DOC_CREATED_AT]: timestamp,
        [DOC_UPDATED_AT]: timestamp,
        [DOC_DELETED_AT]: null,
      };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return stripMetadata(snapshot.data());
    },
  };

  const update: ZodConverter<T> = {
    toFirestore(model: T): DocumentData {
      const timestamp = Timestamp.now();
      return {
        ...model,
        [DOC_VERSION]: DOC_VERSION_V1,
        [DOC_CREATED_AT]: null,
        [DOC_UPDATED_AT]: timestamp,
        [DOC_DELETED_AT]: null,
      };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return stripMetadata(snapshot.data());
    },
  };

  const del: ZodConverter<T> = {
    toFirestore(model: T): DocumentData {
      const timestamp = Timestamp.now();
      return {
        ...model,
        [DOC_VERSION]: DOC_VERSION_V1,
        [DOC_CREATED_AT]: null,
        [DOC_UPDATED_AT]: null,
        [DOC_DELETED_AT]: timestamp,
      };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return stripMetadata(snapshot.data());
    },
  };

  return { read, create, update, delete: del };
};

export const zodConverter = <T extends DocumentData>(schema: z.ZodType<T>): ZodConverter<T> => {
  return {
    toFirestore(model: T): DocumentData {
      return schema.parse(model);
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return schema.parse(snapshot.data());
    },
  };
};
