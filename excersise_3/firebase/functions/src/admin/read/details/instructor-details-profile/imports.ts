import { createCashedInstructorDetailsProfileDocumentWhenInstructorDocIsCreated } from './create_v1';
import { editCashedInstructorDetailsProfileDocumentWhenDrivingSessionDocIsCreated } from './edit_v1.03';

export const IMPORTS_FOR_CASHED_INSTRUCTOR_DETAILS_PROFILE = [
  createCashedInstructorDetailsProfileDocumentWhenInstructorDocIsCreated,
  editCashedInstructorDetailsProfileDocumentWhenDrivingSessionDocIsCreated,
];
