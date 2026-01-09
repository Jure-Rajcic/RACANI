import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  DRIVING_TRAINING_SESSION_ABSOLUTE_PATH,
  DrivingTrainingDocV1,
} from '@models/admin/write/system/driving-training-session.collection';

import { DOC_TYPE, DOC_TYPE_CASHED, DOC_VERSION, DOC_VERSION_V1 } from '@utils/constants';
import {
  INSTRUCTOR_DETAILS_PROFILE_ABSOLUTE_PATH,
  InstructorDetailsProfileDocCachedV1,
} from '@models/admin/read/details/instructor-details-profile.collection';
import { debug, info, warn } from 'firebase-functions/logger';
import { FirestoreUpdate, flattenForFirestoreUpdate } from '@utils/common';

/**
 * Updates cached instructor profile documents when a new driving session is logged.
 *
 * This trigger function fires when a new driving session document is created. It updates
 * the corresponding instructor's cached profile document by incrementing their totalLessons
 * count in allTimeStats. This maintains accurate lesson metrics for instructors without
 * requiring expensive recalculations.
 *
 * The function performs the following steps:
 * 1. Finds the cached profile document for the instructor
 * 2. Updates the totalLessons count atomically using FieldValue.increment
 * 3. Records the update in the instructor's update history with document reference
 *
 * The function validates that exactly one cached profile document exists for the instructor
 * before proceeding with any updates. Unlike the driving exam trigger, this function processes
 * all driving sessions regardless of status, as each session represents a completed lesson.
 *
 * @fires When a new driving session document is created
 * @access Firebase Cloud Function - Firestore Trigger
 * @returns {Promise<boolean|null>} True if update succeeds, false if it fails, null if skipped
 */
export const editCashedInstructorDetailsProfileDocumentWhenDrivingSessionDocIsCreated = functions.firestore
  .document(`${DRIVING_TRAINING_SESSION_ABSOLUTE_PATH}/{docId}`)
  .onCreate(async snapshot => {
    const firestore = admin.firestore();
    const snapshotData = snapshot.data() as DrivingTrainingDocV1;
    const instructorId = snapshotData.instructorId;

    info(`[InstructorProfile] Processing new driving session for instructor: ${instructorId}`);

    debug(`[InstructorProfile] Looking up cached profile document for instructor: ${instructorId}`);

    // Query for the instructor's cached profile document
    const statsQuery = await firestore
      .collection(INSTRUCTOR_DETAILS_PROFILE_ABSOLUTE_PATH)
      .where('instructorId', '==', instructorId)
      .where(DOC_VERSION, '==', DOC_VERSION_V1)
      .where(DOC_TYPE, 'in', [DOC_TYPE_CASHED])
      .get();

    // Validate query results
    if (statsQuery.empty) {
      warn(`[InstructorProfile] ERROR: No cached profile document found for instructor: ${instructorId}`);
      warn(
        `[InstructorProfile] HINT: The cached profile document should have been created when instructor ID ${instructorId} was registered`,
      );
      return false;
    }

    if (statsQuery.docs.length > 1) {
      warn(
        `[InstructorProfile] ERROR: Multiple cached profile documents (${statsQuery.docs.length}) found for instructor: ${instructorId}`,
      );
      warn(
        `[InstructorProfile] HINT: Data inconsistency - only one document with instructorId=${instructorId} and cached doc type should exist`,
      );
      return false;
    }

    // Profile document found and validated
    debug(`[InstructorProfile] Successfully found profile document for instructor: ${instructorId}`);
    const statsDoc = statsQuery.docs[0];
    const docRef = statsDoc.ref;

    // Prepare the update using type-safe nested object structure
    // This ensures we maintain type safety with our Firestore model
    const typeSafeUpdate: FirestoreUpdate<InstructorDetailsProfileDocCachedV1> = {
      profile: {
        allTimeStats: {
          // Increment the total passes count by 1
          totalLessons: FieldValue.increment(1),
        },
        // Add entry to the update history for audit trail
      },
    };

    // Convert the nested structure to dot notation for Firestore
    // This is critical for correct handling of FieldValue operations
    const flattenedUpdate = flattenForFirestoreUpdate(typeSafeUpdate);

    // Log the update operation
    info(`[InstructorProfile] Updating profile.allTimeStats.totalLessons for instructor: ${instructorId}`);

    // Attempt the Firestore update
    try {
      await docRef.update(flattenedUpdate);
      debug(`[InstructorProfile] Successfully updated totalLessons counter for instructor: ${instructorId}`);
    } catch (error) {
      // Handle update failure with detailed error information
      warn(`[InstructorProfile] ERROR: Failed to update totalLessons for instructor: ${instructorId}`, error);
      return false;
    }

    // Log successful completion
    info(
      `[InstructorProfile] ✅ Successfully completed lesson tracking update for instructor: ${instructorId} (session ID: ${snapshot.id})`,
    );
    return true;
  });
