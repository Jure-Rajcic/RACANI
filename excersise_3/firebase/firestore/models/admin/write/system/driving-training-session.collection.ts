import { DOC_ID, DOC_TYPE, DOC_VERSION, DOC_VERSION_V1 } from '@utils/constants';
import { GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { ADMIN_APP_COLL, ADMIN_APP_DOC } from '@models/admin/base.doc';
import { ADMIN_WRITEONLY_COLL, ADMIN_WRITEONLY_SYSTEM_DOC } from '@write/write.doc';

const DRIVING_TRAINING_SESSION = 'driving-training-session';
export const DRIVING_TRAINING_SESSION_ABSOLUTE_PATH = [
  ADMIN_APP_COLL,
  ADMIN_APP_DOC,
  ADMIN_WRITEONLY_COLL,
  ADMIN_WRITEONLY_SYSTEM_DOC,
  DRIVING_TRAINING_SESSION,
].join('/');

export const TRAINING_CREATION = 'training-creation';
export const DOC_TYPE_EXAM_COMPLETED_PASSED_CREATION = 'exam-completed-passed-creation';
export const DOC_TYPE_EXAM_COMPLETED_FAILED_CREATION = 'exam-completed-failed-creation';

export type DrivingTrainingDocV1 = {
  [DOC_ID]: string;
  [DOC_VERSION]: typeof DOC_VERSION_V1;
  [DOC_TYPE]: typeof TRAINING_CREATION;

  clientId: string;
  instructorId: string;
  vehicleId: string;
  lessonNumber: number;
  lessonGrade: '1' | '2' | '3' | '4' | '5';
  lessonTimestampStart: Timestamp;
  lessonTimestampEnd: Timestamp;
  geoPointStart: GeoPoint;
  geoPointEnd: GeoPoint;
  gpsPoints: {
    point: GeoPoint;
    timestamp: Timestamp;
  }[];
  lessonVideoUrl: string;
  lessonErrorLogs: {
    timestamp: Timestamp;
    severity: 'warning' | 'error';
    description: string;
    geoPoint: GeoPoint;
  }[];
  lessonNotes: {
    timestamp: Timestamp;
    note: string;
  }[];
};

export type AllCreateDocTypesV1 = DrivingTrainingDocV1;
