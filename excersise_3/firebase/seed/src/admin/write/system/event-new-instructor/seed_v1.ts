import { Firestore, Timestamp } from 'firebase-admin/firestore';
import {
  EVENT_NEW_INSTRUCTOR_ABSOLUTE_PATH,
  EventNewInstructorDocV1,
} from '@models/admin/write/system/event-new-instructor.collection';

import {
  DOC_ACTOR_ID,
  DOC_ACTOR_ROLE,
  DOC_CREATED_AT,
  DOC_ID,
  DOC_TYPE,
  DOC_TYPE_CREATION,
  DOC_VERSION,
  DOC_VERSION_V1,
} from '@utils/constants';

export async function seedV1(db: Firestore) {
  const collectionRef = db.collection(EVENT_NEW_INSTRUCTOR_ABSOLUTE_PATH);
  const batch = db.batch();

  const today = new Date(Date.now());

  const docRef1 = collectionRef.doc();
  const doc1: EventNewInstructorDocV1 = {
    [DOC_ID]: docRef1.id,
    [DOC_TYPE]: DOC_TYPE_CREATION,
    [DOC_VERSION]: DOC_VERSION_V1,
    [DOC_ACTOR_ID]: '1',
    [DOC_ACTOR_ROLE]: 'developer',
    instructorId: '1',
    [DOC_CREATED_AT]: Timestamp.fromDate(today),
  };
  batch.set(docRef1, doc1);

  await batch.commit();
}
