import { Timestamp } from 'firebase-admin/firestore';
import {
  DOC_ID,
  DOC_TYPE,
  DOC_TYPE_CASHED,
  DOC_VERSION,
  DOC_VERSION_V1,
  DocIdType,
  DocMonthType,
} from '@utils/constants';
import { ADMIN_APP_COLL, ADMIN_APP_DOC } from '@models/admin/base.doc';
import { ADMIN_READONLY_COLL, ADMIN_READONLY_DETAILS_DOC } from '@read/read.doc';

const INSTRUCTOR_STUDENT_DETAILS = 'instructor-details-students';
export const INSTRUCTOR_DETAILS_STUDENTS_ABSOLUTE_PATH = [
  ADMIN_APP_COLL,
  ADMIN_APP_DOC,
  ADMIN_READONLY_COLL,
  ADMIN_READONLY_DETAILS_DOC,
  INSTRUCTOR_STUDENT_DETAILS,
].join('/');
export const STUDENTS = 'students';
export const LAST_6_MONTHS_STATS = 'last6MonthsStats';
export const USAGE = 'usage';

export const STUDENT_SUMMARY = 'studentSummary';
export const STUDENT_HISTORY_SUMMARY = 'studentHistorySummary';
export const BRIEF_SUMMARY = 'briefSummary';

export type InstructorDetailsStudentsDocCachedV1 = {
  [DOC_ID]: DocIdType;
  [DOC_TYPE]: typeof DOC_TYPE_CASHED;
  [DOC_VERSION]: typeof DOC_VERSION_V1;
  instructorId: string;
  [STUDENTS]: {
    [LAST_6_MONTHS_STATS]: {
      [USAGE]: {
        studentId: string;
        month: DocMonthType;
        totalLessons: number;
      }[];
    };
    [STUDENT_SUMMARY]: {
      studentId: string;
      studentStatus: 'assigned' | 'revoked';
      currentLessonsCount: number;
    }[];
    [STUDENT_HISTORY_SUMMARY]: {
      studentId: string;
      vehicleId: string;
      timestamp: Timestamp;
      sourceDocumentId: DocIdType;
      [BRIEF_SUMMARY]: {
        summaryType: 'lesson' | 'exam';
        lesson?: {
          grade: '1' | '2' | '3' | '4' | '5';
          lessonNumber: number;
        };
        exam?: {
          passed: boolean;
          tryNumber: number;
        };
      };
    }[];
  };
};

export type InstructorDetailsStudentsDocCachedV1Students = InstructorDetailsStudentsDocCachedV1[typeof STUDENTS];

export type InstructorDetailsStudentsDocCachedV1StudentsLast6MonthsStats =
  InstructorDetailsStudentsDocCachedV1Students[typeof LAST_6_MONTHS_STATS];
export type InstructorDetailsStudentsDocCachedV1StudentsLast6MonthsStatsUsageEl =
  InstructorDetailsStudentsDocCachedV1StudentsLast6MonthsStats[typeof USAGE][0];

export type InstructorDetailsStudentsDocCachedV1StudentsStudentSummary =
  InstructorDetailsStudentsDocCachedV1Students[typeof STUDENT_SUMMARY];

export type InstructorDetailsStudentsDocCachedV1StudentsStudentHistorySummary =
  InstructorDetailsStudentsDocCachedV1Students[typeof STUDENT_HISTORY_SUMMARY];

export type InstructorDetailsStudentsDocCachedV1StudentsStudentHistorySummaryEl =
  InstructorDetailsStudentsDocCachedV1StudentsStudentHistorySummary[0];
