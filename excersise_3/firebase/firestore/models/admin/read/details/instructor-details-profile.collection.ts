import { Timestamp } from 'firebase-admin/firestore';
import { DOC_TYPE, DOC_TYPE_CASHED, DOC_VERSION, DOC_VERSION_V1, DocMonthType } from '@utils/constants';
import { ADMIN_APP_COLL, ADMIN_APP_DOC } from '@models/admin/base.doc';
import { ADMIN_READONLY_COLL, ADMIN_READONLY_DETAILS_DOC } from '@read/read.doc';

const INSTRUCTOR_DETAILS_PROFILE = 'instructor-details-profile';
export const INSTRUCTOR_DETAILS_PROFILE_ABSOLUTE_PATH = [
  ADMIN_APP_COLL,
  ADMIN_APP_DOC,
  ADMIN_READONLY_COLL,
  ADMIN_READONLY_DETAILS_DOC,
  INSTRUCTOR_DETAILS_PROFILE,
].join('/');

export const PROFILE = 'profile';

export type InstructorDetailsProfileDocCachedV1 = {
  [DOC_TYPE]: typeof DOC_TYPE_CASHED;
  [DOC_VERSION]: typeof DOC_VERSION_V1;
  instructorId: string;
  [PROFILE]: {
    allTimeStats: {
      totalSatisfaction: {
        '1': number;
        '2': number;
        '3': number;
        '4': number;
        '5': number;
      };
      totalPasses: number;
      totalStudents: number;
      totalLessons: number;
    };
    last6MonthsTrends: {
      passRateTrend: {
        month: DocMonthType;
        passRate: number;
      }[];
      satisfactionTrend: {
        month: DocMonthType;
        satisfaction: {
          '1': number;
          '2': number;
          '3': number;
          '4': number;
          '5': number;
        };
      }[];
    };
    contact: {
      avatarUrl: string | null;
      name: string;
      surname: string;
      dateOfBirth: Timestamp;
      email: string;
      phone: string;
      joinDate: Timestamp;
      location: string;
    };
    // licenseHistory: {
    //   licenseId: string;
    //   number: string;
    //   issueDate: Timestamp;
    //   expiryDate: Timestamp;
    //   issueAuthority: string;
    //   category: LicenseCategoryKey;
    //   certificateFiles: {
    //     name: string;
    //     url: string;
    //   }[];
    // }[];
    updateHistory: {
      docId: string;
      at: Timestamp;
    }[];
  };
};

export type DocCachedV1Profile = InstructorDetailsProfileDocCachedV1[typeof PROFILE];
// export type DocCachedV1ProfileAllTimeStats = DocCachedV1Profile['allTimeStats'];
// export type DocCachedV1ProfileLast6MonthsTrends = DocCachedV1Profile['last6MonthsTrends'];
// export type DocCachedV1ProfileContact = DocCachedV1Profile['contact'];
// export type DocCachedV1ProfileLicenseHistory = DocCachedV1Profile['licenseHistory'];
// export type DocCachedV1ProfileLicenseHistoryItem = DocCachedV1ProfileLicenseHistory[number];
// export type DocCachedV1ProfileUpdateHistory = DocCachedV1Profile['updateHistory'];
// export type DocCachedV1ProfileUpdateHistoryItem = DocCachedV1ProfileUpdateHistory[number];
