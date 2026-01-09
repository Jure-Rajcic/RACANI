import { inject, Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  Firestore,
  where,
  query,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  DocumentData,
  deleteField,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getDatabase, Database, connectDatabaseEmulator } from 'firebase/database';
// We are removing 'firebase/functions' to solve the build error
import {
  provideFunctions,
  getFunctions,
  connectFunctionsEmulator,
  HttpsCallableOptions,
} from '@angular/fire/functions';
import { environment } from '../../../../environment/environment.dev';
import { AuthService } from '../auth/auth.service';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { FirebaseApp } from '@angular/fire/app';

export type DocId = { docId: string };
type Filter = { field: string; condition: any; value: any };

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private readonly app = inject(FirebaseApp);
  private readonly functions = inject(Functions); // <-- will work once provided
  readonly db = getFirestore(this.app);
  readonly rtdb = getDatabase(this.app);
  readonly authService = inject(AuthService);

  constructor() {
    if (environment.useEmulators) {
      console.log('🔧 Using Firebase Emulators');
      connectFirestoreEmulator(this.db, environment.emulators.firestore.host, environment.emulators.firestore.port);
      connectDatabaseEmulator(this.rtdb, environment.emulators.database.host, environment.emulators.database.port);
    } else {
      console.log('🔥 Using Production Firebase');
    }
  }

  // Method to add data to Firestore only if user is authenticated
  async addDoc<T>(collectionName: string, data: Record<string, any>): Promise<string> {
    if (!this.authService.isLoggedIn()) throw new Error('User is not authenticated');

    console.log(`Adding document to ${collectionName}`, data);
    const docRef = await addDoc(collection(this.db, collectionName), {
      ...data,
    });
    return docRef.id;
  }

  private flattenForFirestore(obj: Record<string, any>, parentKey = ''): Record<string, any> {
    let result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const path = parentKey ? `${parentKey}.${key}` : key;

      if (value === undefined) {
        result[path] = deleteField();
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const nested = this.flattenForFirestore(value, path);
        Object.assign(result, nested);
      } else {
        result[path] = value;
      }
    }

    return result;
  }

  // Method to edit a document by ID
  async updateDoc<T extends DocumentData>(collectionName: string, docId: string, data: T) {
    if (!this.authService.isLoggedIn()) throw new Error('User is not authenticated');
    const docRef = doc(this.db, collectionName, docId);
    const cleanedData = this.flattenForFirestore(data);
    await updateDoc(docRef, cleanedData);
    console.log(`Document with ID ${docId} updated in ${collectionName}`);
  }

  // Method to delete a document by ID
  async deleteDoc(collectionName: string, docId: string) {
    if (!this.authService.isLoggedIn()) throw new Error('User is not authenticated');
    const docRef = doc(this.db, collectionName, docId);
    await deleteDoc(docRef);
    console.log(`Document with ID ${docId} deleted from ${collectionName}`);
    return;
  }

  // Fetch a single document by ID
  async getDoc<T>(collectionName: string, docId: string): Promise<T> {
    if (!this.authService.isLoggedIn()) throw new Error('User is not authenticated');

    const docRef = doc(this.db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Document ${docId} not found in ${collectionName}`);
    }

    return { id: docSnap.id, ...docSnap.data() } as T;
  }

  // Method to get data only for the logged-in user
  async getDocs<T>(collectionName: string): Promise<(T & DocId)[]> {
    return this.getFilteredDocs<T>(collectionName, []);
  }

  // TOOD replace with better calls
  async getFilteredDocs<T>(coll: string, filters: Filter[]): Promise<(T & DocId)[]> {
    if (!this.authService.isLoggedIn()) throw new Error('User is not authenticated');

    let q = query(collection(this.db, coll));

    filters.forEach(f => (q = query(q, where(f.field, f.condition, f.value))));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data(),
    })) as (T & DocId)[];
  }

  /**
   * Call a Firebase Cloud Function using 'fetch' to avoid build errors.
   * @param functionName Name of the function to call
   * @param data Data to pass to the function
   * @returns Promise with the function result
   */
  // firebase.service.ts
  callCallable<T, R>(
    name: string,
    data?: T,
    options?: HttpsCallableOptions, // <-- 2. Add optional options argument
  ): Promise<R> {
    // 3. Pass options to the httpsCallable factory
    const fn = httpsCallable<T, R>(this.functions, name, options);
    return fn(data as T).then(res => res.data);
  }
}
