import * as admin from 'firebase-admin';
import { seedV1 as seedBase } from './admin/base/seed_v1';
import { seedV1 as seedForInstructorLogs } from './admin/write/system/event-new-instructor/seed_v1';
// import { seedV1 as seed2 } from './seed/app-clients/seed_v1';
import { seedV1 as seedForDrivingTrainingSession } from './admin/write/system/driving-training-session/seed_v1';
import { environment } from '@env/environment.dev';

admin.initializeApp(environment.firebaseConfig);

const db = admin.firestore();
db.settings({
  host: 'localhost:8080',
  ssl: false,
});

export const clearCollection = async (collectionPath: string) => {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();

  // First, recursively delete all subcollections for each document
  for (const doc of snapshot.docs) {
    const subcollections = await doc.ref.listCollections();
    for (const subCollection of subcollections) {
      await clearCollection(`${collectionPath}/${doc.id}/${subCollection.id}`);
    }
  }

  // Then delete the documents in this collection
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  if (snapshot.size > 0) await batch.commit();

  console.log(`Cleared collection: ${collectionPath}`);
};

async function seedDB() {
  console.log('Starting Firestore seeding process...');
  const collections = await db.listCollections();
  for (const collection of collections) await clearCollection(collection.id);
  for (const seed of SEEDS) await seed(db);
  console.log('Firestore seeding process completed successfully.');
  process.exit(0);
}

const SEEDS = [seedBase, seedForInstructorLogs, seedForDrivingTrainingSession];

seedDB();
