import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DOC_TYPE, DOC_TYPE_CASHED, DOC_VERSION, DOC_VERSION_V1, DocMonthType } from '@utils/constants';

import {
  DRIVING_TRAINING_SESSION_ABSOLUTE_PATH,
  DrivingTrainingDocV1,
} from '@models/admin/write/system/driving-training-session.collection';
import { debug, info, warn } from 'firebase-functions/logger';

import {
  INSTRUCTOR_DETAILS_STUDENTS_ABSOLUTE_PATH,
  InstructorDetailsStudentsDocCachedV1,
  LAST_6_MONTHS_STATS,
  USAGE,
  STUDENTS,
} from '@models/admin/read/details/instructor-details-students.collection';
import { flattenForFirestoreUpdate, DeepPartial } from '@utils/common';
import { docMonthFormat, getDateSixMonthsAgo } from '@utils/date.utils';

/**
 * Updates cached instructor student usage statistics when a driving training session is created.
 *
 * This function triggers when a new driving training session document is created and updates
 * the usage tracking in the cached student document. It maintains a rolling 6-month window
 * of lesson counts per student per month.
 *
 * @fires Once per driving training session document creation
 * @access Firebase Cloud Function - Firestore Trigger
 */
export const editCashedInstructorDetailsStudentsUsageDocumentWhenDrivingTrainingSessionDocumentIsCreated =
  functions.firestore.document(DRIVING_TRAINING_SESSION_ABSOLUTE_PATH + '/{docId}').onCreate(async snapshot => {
    const triggerName = editCashedInstructorDetailsStudentsUsageDocumentWhenDrivingTrainingSessionDocumentIsCreated.name;

    debug(`✅ [${triggerName}] Processing document at path: ${snapshot.ref.path}`);

    const firestore = admin.firestore();
    const snapshotData = snapshot.data() as DrivingTrainingDocV1;

    const instructorId = snapshotData.instructorId;
    const studentId = snapshotData.clientId;
    const lessonTimestamp = snapshotData.lessonTimestampStart;

    // Convert timestamp to month format (YYYY-MM)
    const lessonMonth = docMonthFormat(lessonTimestamp.toDate()) as DocMonthType;

    debug(`✅ [${triggerName}] Lesson month: ${lessonMonth}, Student: ${studentId}, Instructor: ${instructorId}`);

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
        `❌ [${triggerName}] ERROR: No cached student document found for instructor: ${instructorId}`,
      );
      warn(
        `❌ [${triggerName}] HINT: The cached student document should have been created when instructor ID ${instructorId} was registered`,
      );
      return false;
    }

    if (statsQuery.size > 1) {
      warn(
        `❌ [${triggerName}] ERROR: Multiple cached student documents (${statsQuery.size}) found for instructor: ${instructorId}`,
      );
      warn(
        `❌ [${triggerName}] HINT: Data inconsistency - only one document with instructorId=${instructorId} should exist`,
      );
      return false;
    }

    const cachedDoc = statsQuery.docs[0];
    const cachedDocData = cachedDoc.data() as DeepPartial<InstructorDetailsStudentsDocCachedV1>;
    debug(`✅ [${triggerName}] Successfully found cached student document for instructor: ${instructorId}`);

    info(
      `🔍 [InstructorStudentUsage] Processing lesson for instructor: ${instructorId}, student: ${studentId}, month: ${lessonMonth}`,
    );

    // Get current usage array or create new one
    const currentUsage = cachedDocData[STUDENTS]?.[LAST_6_MONTHS_STATS]?.[USAGE] || [];

    // Find existing usage entry for this student and month
    const usageIndex = currentUsage.findIndex(u => u.studentId === studentId && u.month === lessonMonth);

    if (usageIndex === -1) {
      // Create new usage entry
      currentUsage.push({
        studentId: studentId,
        month: lessonMonth,
        totalLessons: 1,
      });
      debug(`✅ [${triggerName}] Created new usage entry for student: ${studentId}, month: ${lessonMonth}`);
    } else {
      // Update existing usage entry
      const existingEntry = currentUsage[usageIndex];
      if (existingEntry) {
        existingEntry.totalLessons = (existingEntry.totalLessons || 0) + 1;
        debug(
          `✅ [${triggerName}] Updated usage entry for student: ${studentId}, month: ${lessonMonth}, total: ${existingEntry.totalLessons}`,
        );
      }
    }

    // Filter to keep only last 6 months
    const sixMonthsAgo = getDateSixMonthsAgo();
    const sixMonthsAgoFormatted = docMonthFormat(sixMonthsAgo) as DocMonthType;

    const filteredUsage = currentUsage.filter(u => {
      // Keep entries from the last 6 months
      return u.month && u.month >= sixMonthsAgoFormatted;
    });

    debug(
      `✅ [${triggerName}] Filtered usage: ${filteredUsage.length} entries (removed ${currentUsage.length - filteredUsage.length} old entries)`,
    );

    // Prepare update
    const typeSafeUpdate = {
      [`${STUDENTS}.${LAST_6_MONTHS_STATS}.${USAGE}`]: filteredUsage,
    };

    const flattenedUpdate = flattenForFirestoreUpdate(typeSafeUpdate);

    try {
      await cachedDoc.ref.update(flattenedUpdate);
      debug(`✅ [${triggerName}] Successfully updated usage statistics for instructor: ${instructorId}`);
      info(
        `✅ [InstructorStudentUsage] Successfully completed usage tracking update for instructor: ${instructorId}`,
      );
      return true;
    } catch (error) {
      warn(`❌ [${triggerName}] Failed to update usage statistics for instructor: ${instructorId}`, error);
      return false;
    }
  });
