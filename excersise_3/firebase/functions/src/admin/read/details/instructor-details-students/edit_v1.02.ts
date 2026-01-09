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
  BRIEF_SUMMARY,
  InstructorDetailsStudentsDocCachedV1,
  InstructorDetailsStudentsDocCachedV1StudentsStudentHistorySummaryEl,
  STUDENT_HISTORY_SUMMARY,
  STUDENTS,
} from '@models/admin/read/details/instructor-details-students.collection';
import { FirestoreUpdate, flattenForFirestoreUpdate } from '@utils/common';
import { FieldValue } from 'firebase-admin/firestore';

export const editCashedInstructorDetailsStudentsDocumentWhenDrivingTrainingSessionDocumentIsCreated = functions.firestore
  .document(DRIVING_TRAINING_SESSION_ABSOLUTE_PATH + '/{docId}')
  .onCreate(async snapshot => {
    debug(`[Triggered for logs-driving-session] processing document at path: ${snapshot.ref.path}`);

    const firestore = admin.firestore();
    const data = snapshot.data() as DrivingTrainingDocV1;

    const instructorId = data.instructorId;

    // Query for existing cached student document for this instructor
    const statsQuery = await firestore
      .collection(INSTRUCTOR_DETAILS_STUDENTS_ABSOLUTE_PATH)
      .where(DOC_VERSION, '==', DOC_VERSION_V1)
      .where('instructorId', '==', instructorId)
      .where(DOC_TYPE, 'in', [DOC_TYPE_CASHED])
      .get();

    // Validate query results
    if (statsQuery.empty) {
      warn(
        `[trigger: ${editCashedInstructorDetailsStudentsDocumentWhenDrivingTrainingSessionDocumentIsCreated.name}] ERROR: No cached student document found for instructor: ${instructorId}`,
      );
      warn(
        `[trigger: ${editCashedInstructorDetailsStudentsDocumentWhenDrivingTrainingSessionDocumentIsCreated.name}] HINT: The cached student document should have been created when instructor ID ${instructorId} was registered`,
      );
      return false;
    }

    if (statsQuery.docs.length > 1) {
      warn(
        `[InstructorProfile] ERROR: Multiple cached student documents (${statsQuery.docs.length}) found for instructor: ${instructorId}`,
      );
      warn(
        `[InstructorProfile] HINT: Data inconsistency - only one document with instructorId=${instructorId} and cached doc type should exist`,
      );
      return false;
    }

    debug(`[InstructorProfile] Successfully found cached student document for instructor: ${instructorId}`);
    const statsDoc = statsQuery.docs[0];
    const docRef = statsDoc.ref;

    // Extract required data from the driving session
    const studentId = data.clientId;
    const vehicleId = data.vehicleId;
    const lessonGrade = data.lessonGrade;
    const lessonNumber = data.lessonNumber;
    const lessonTimestamp = data.lessonTimestampStart;
    const sourceDocumentId = snapshot.id;

    // Create new student history entry using FieldValue.arrayUnion to avoid type conflicts
    const newStudentHistoryEntry: InstructorDetailsStudentsDocCachedV1StudentsStudentHistorySummaryEl = {
      studentId: studentId,
      vehicleId: vehicleId,
      timestamp: lessonTimestamp,
      sourceDocumentId: sourceDocumentId,
      [BRIEF_SUMMARY]: {
        summaryType: 'lesson',
        lesson: {
          grade: lessonGrade,
          lessonNumber: lessonNumber,
        },
      },
    };

    // Prepare the update using type-safe nested object structure with FieldValue.arrayUnion
    const typeSafeUpdate: FirestoreUpdate<InstructorDetailsStudentsDocCachedV1> = {
      [STUDENTS]: {
        [STUDENT_HISTORY_SUMMARY]: FieldValue.arrayUnion(newStudentHistoryEntry),
      },
    };

    // Convert the nested structure to dot notation for Firestore
    const flattenedUpdate = flattenForFirestoreUpdate(typeSafeUpdate);

    // Log the update operation
    info(
      `[InstructorProfile] Adding student history entry for instructor: ${instructorId}, student: ${studentId}, vehicle: ${vehicleId}, lesson: ${lessonNumber}`,
    );

    // Attempt the Firestore update
    try {
      await docRef.update(flattenedUpdate);
      debug(`[InstructorProfile] Successfully updated student history for instructor: ${instructorId}`);
    } catch (error) {
      warn(`[InstructorProfile] ERROR: Failed to update student history for instructor: ${instructorId}`, error);
      return false;
    }

    info(`[InstructorProfile] Successfully completed student history tracking update for instructor: ${instructorId}`);
    return true;
  });
