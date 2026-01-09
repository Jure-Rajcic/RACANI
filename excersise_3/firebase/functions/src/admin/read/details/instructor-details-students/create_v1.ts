import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DOC_ID, DOC_TYPE, DOC_TYPE_CASHED, DOC_VERSION, DOC_VERSION_V1 } from '@utils/constants';
import {
  EVENT_NEW_INSTRUCTOR_ABSOLUTE_PATH,
  EventNewInstructorDocV1,
} from '@models/admin/write/system/event-new-instructor.collection';

import {
  INSTRUCTOR_DETAILS_STUDENTS_ABSOLUTE_PATH,
  InstructorDetailsStudentsDocCachedV1,
  STUDENTS,
} from '@models/admin/read/details/instructor-details-students.collection';
import { debug, info, warn } from 'firebase-functions/logger';
import { FirestoreUpdate, flattenForFirestoreUpdate } from '@utils/common';

/**
 * Creates a cached instructor student document when a new instructor is created.
 *
 * This function triggers on instructor document creation and creates a corresponding cached
 * student document with default values for stats, trends, and contact information. The cached
 * document is used for quicker access to instructor student data throughout the application.
 *
 * @fires Once per new instructor document creation
 * @access Firebase Cloud Function - Firestore Trigger
 */

export const createCashedInstructorDetailsStudentDocumentWhenInstructorDocIsCreated = functions.firestore
  .document(EVENT_NEW_INSTRUCTOR_ABSOLUTE_PATH + '/{instructorDocId}')
  .onCreate(async snapshot => {
    info('[InstructorStudent] Cached student document creation initiated');
    debug(`[InstructorStudent] Processing document at path: ${snapshot.ref.path}`);
    const firestore = admin.firestore();
    const data = snapshot.data() as EventNewInstructorDocV1;
    const col = firestore.collection(INSTRUCTOR_DETAILS_STUDENTS_ABSOLUTE_PATH);
    const docRef = col.doc();

    const typeSafeUpdate1: FirestoreUpdate<InstructorDetailsStudentsDocCachedV1> = {
      [DOC_ID]: docRef.id,
      [DOC_TYPE]: DOC_TYPE_CASHED,
      [DOC_VERSION]: DOC_VERSION_V1,
      instructorId: data.instructorId,
      [STUDENTS]: {},
    };
    const flattenedUpdate = flattenForFirestoreUpdate(typeSafeUpdate1);
    info(`[InstructorStudent] Creating cached student for instructor: ${data.instructorId}`);
    try {
      await docRef.set(flattenedUpdate);
      debug(`[InstructorStudent] Successfully created student document: ${docRef.id}`);
      return true;
    } catch (error) {
      warn(`[InstructorStudent] Failed to create student document for instructor: ${data.instructorId}`, error);
      return false;
    }
  });
