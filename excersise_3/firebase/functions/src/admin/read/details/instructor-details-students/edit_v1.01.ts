import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DOC_TYPE, DOC_TYPE_CASHED, DOC_VERSION, DOC_VERSION_V1 } from '@utils/constants';

import {
  DRIVING_TRAINING_SESSION_ABSOLUTE_PATH,
  DrivingTrainingDocV1,
} from '@models/admin/write/system/driving-training-session.collection';
import { debug, info, warn } from 'firebase-functions/logger';

import {
  INSTRUCTOR_DETAILS_STUDENTS_ABSOLUTE_PATH,
  InstructorDetailsStudentsDocCachedV1,
  STUDENT_SUMMARY,
  STUDENTS,
} from '@models/admin/read/details/instructor-details-students.collection';
import { flattenForFirestoreUpdate, DeepPartial } from '@utils/common';

/**
 * Updates cached instructor student document when a driving training session is created.
 *
 * This function triggers when a new driving training session document is created and updates
 * the corresponding cached student document with lesson count and student assignment information.
 *
 * @fires Once per driving training session document creation
 * @access Firebase Cloud Function - Firestore Trigger
 */
export const editCashedInstructorDetailsStudentDocumentWhenDrivingTrainingSessionDocIsCreated = functions.firestore
  .document(DRIVING_TRAINING_SESSION_ABSOLUTE_PATH + '/{docId}')
  .onCreate(async snapshot => {
    const triggerName = editCashedInstructorDetailsStudentDocumentWhenDrivingTrainingSessionDocIsCreated.name;

    debug(`[Triggered ${triggerName}] processing document at path: ${snapshot.ref.path}`);

    const firestore = admin.firestore();
    const snapshotData = snapshot.data() as DrivingTrainingDocV1;

    const instructorId = snapshotData.instructorId;
    const studentId = snapshotData.clientId;

    // Query for existing cached student document for this instructor
    const statsQuery = await firestore
      .collection(INSTRUCTOR_DETAILS_STUDENTS_ABSOLUTE_PATH)
      .where(DOC_VERSION, '==', DOC_VERSION_V1)
      .where('instructorId', '==', instructorId)
      .where(DOC_TYPE, 'in', [DOC_TYPE_CASHED])
      .get();

    // Validate query results
    if (statsQuery.empty) {
      warn(`[trigger: ${triggerName}] ERROR: No cached student document found for instructor: ${instructorId}`);
      warn(
        `[trigger: ${triggerName}] HINT: The cached student document should have been created when instructor ID ${instructorId} was registered`,
      );
      return false;
    }

    if (statsQuery.size > 1) {
      warn(`[trigger: ${triggerName}] ERROR: Multiple cached student documents found for instructor: ${instructorId}`);
      return false;
    }

    const cachedDoc = statsQuery.docs[0];
    const cachedDocData = cachedDoc.data() as DeepPartial<InstructorDetailsStudentsDocCachedV1>;
    debug(`[trigger: ${triggerName}] Successfully found cached student document for instructor: ${instructorId}`);

    info(`[InstructorStudent] Processing lesson creation for instructor: ${instructorId}, student: ${studentId}`);

    // Get current student summary or create new one
    const currentStudentSummary = cachedDocData[STUDENTS]?.[STUDENT_SUMMARY] || [];
    let studentSummaryIndex = currentStudentSummary.findIndex(s => s.studentId === studentId);

    if (studentSummaryIndex === -1) {
      // Create new student summary entry
      currentStudentSummary.push({
        studentId: studentId,
        studentStatus: 'assigned',
        currentLessonsCount: 1,
      });
      studentSummaryIndex = currentStudentSummary.length - 1;
    } else {
      // Update existing student summary
      const existingEntry = currentStudentSummary[studentSummaryIndex];
      if (existingEntry) {
        existingEntry.currentLessonsCount = (existingEntry.currentLessonsCount || 0) + 1;
      }
    }

    const typeSafeUpdate = {
      [`${STUDENTS}.${STUDENT_SUMMARY}`]: currentStudentSummary,
    };

    const flattenedUpdate = flattenForFirestoreUpdate(typeSafeUpdate);

    try {
      await cachedDoc.ref.update(flattenedUpdate);
      debug(`[trigger: ${triggerName}] Successfully updated student summary for instructor: ${instructorId}`);
      info(`[InstructorStudent] Successfully completed lesson tracking update for instructor: ${instructorId}`);
      return true;
    } catch (error) {
      warn(`[trigger: ${triggerName}] Failed to update student document for instructor: ${instructorId}`, error);
      return false;
    }
  });
