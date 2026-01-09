// Centralized export for all Cloud Functions.
// The Firebase CLI and emulators will read this file to discover your functions.
// Initialize Firebase Admin SDK if it hasn't been initialized yet
import * as admin from 'firebase-admin';
admin.initializeApp();

// Cashed Instructor Triggers
export { IMPORTS_FOR_CASHED_INSTRUCTOR_DETAILS_PROFILE } from './admin/read/details/instructor-details-profile/imports';
export { IMPORTS_FOR_CASHED_INSTRUCTOR_DETAILS_STUDENTS } from './admin/read/details/instructor-details-students/imports';
