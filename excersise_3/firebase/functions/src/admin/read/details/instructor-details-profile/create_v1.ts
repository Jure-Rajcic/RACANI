import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DOC_TYPE, DOC_TYPE_CASHED, DOC_VERSION, DOC_VERSION_V1 } from '@utils/constants';

import {
  EVENT_NEW_INSTRUCTOR_ABSOLUTE_PATH,
  EventNewInstructorDocV1,
} from '@models/admin/write/system/event-new-instructor.collection';

import {
  INSTRUCTOR_DETAILS_PROFILE_ABSOLUTE_PATH,
  InstructorDetailsProfileDocCachedV1,
} from '@models/admin/read/details/instructor-details-profile.collection';
import { debug, info, warn } from 'firebase-functions/logger';
import { FirestoreUpdate, flattenForFirestoreUpdate } from '@utils/common';

/**
 * Creates a cached instructor profile document when a new instructor is created.
 *
 * This function triggers on instructor document creation and creates a corresponding cached
 * profile document with default values for stats, trends, and contact information. The cached
 * document is used for quicker access to instructor profile data throughout the application.
 *
 * @fires Once per new instructor document creation
 * @access Firebase Cloud Function - Firestore Trigger
 */
export const createCashedInstructorDetailsProfileDocumentWhenInstructorDocIsCreated = functions.firestore
  .document(EVENT_NEW_INSTRUCTOR_ABSOLUTE_PATH + '/{docId}')
  .onCreate(async snapshot => {
    info('[InstructorProfile] Cached profile document creation initiated');
    debug(`[InstructorProfile] Processing document at path: ${snapshot.ref.path}`);
    const firestore = admin.firestore();
    const data = snapshot.data() as EventNewInstructorDocV1;
    const col = firestore.collection(INSTRUCTOR_DETAILS_PROFILE_ABSOLUTE_PATH);
    const docRef = col.doc();

    const typeSafeUpdate1: FirestoreUpdate<InstructorDetailsProfileDocCachedV1> = {
      [DOC_TYPE]: DOC_TYPE_CASHED,
      [DOC_VERSION]: DOC_VERSION_V1,
      instructorId: data.instructorId,
    };
    const flattenedUpdate = flattenForFirestoreUpdate(typeSafeUpdate1);
    info(`[InstructorProfile] Creating cached profile for instructor: ${data.instructorId}`);
    try {
      await docRef.set(flattenedUpdate);
      debug(`[InstructorProfile] Successfully created profile document: ${docRef.id}`);
      return true;
    } catch (error) {
      warn(`[InstructorProfile] Failed to create profile document for instructor1: ${data.instructorId}`, error);
      return false;
    }
  });
