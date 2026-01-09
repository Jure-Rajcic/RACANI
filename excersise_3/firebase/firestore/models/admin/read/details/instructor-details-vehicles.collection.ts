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

const INSTRUCTOR_VEHICLE_DETAILS = 'instructor-details-vehicles';
export const INSTRUCTOR_DETAILS_VEHICLES_ABSOLUTE_PATH = [
  ADMIN_APP_COLL,
  ADMIN_APP_DOC,
  ADMIN_READONLY_COLL,
  ADMIN_READONLY_DETAILS_DOC,
  INSTRUCTOR_VEHICLE_DETAILS,
].join('/');
export const VEHICLES = 'vehicles';
export const LAST_6_MONTHS_STATS = 'last6MonthsStats';
export const USAGE = 'usage';

export const VEHICLE_SUMMARY = 'vehicleSummary';
export const VEHICLE_HISTORY_SUMMARY = 'vehicleHistorySummary';
export const BRIEF_SUMMARY = 'briefSummary';

export type InstructorDetailsVehiclesDocCachedV1 = {
  [DOC_ID]: DocIdType;
  [DOC_TYPE]: typeof DOC_TYPE_CASHED;
  [DOC_VERSION]: typeof DOC_VERSION_V1;
  instructorId: string;
  [VEHICLES]: {
    [LAST_6_MONTHS_STATS]: {
      [USAGE]: {
        vehicleId: string;
        month: DocMonthType;
        totalLessons: number;
      }[];
    };
    [VEHICLE_SUMMARY]: {
      vehicleId: string;
      vehicleStatus: 'assigned' | 'revoked';
      currentStudentsCount: number;
    }[];
    [VEHICLE_HISTORY_SUMMARY]: {
      vehicleId: string;
      studentId: string;
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

export type InstructorDetailsVehiclesDocCachedV1Vehicles = InstructorDetailsVehiclesDocCachedV1[typeof VEHICLES];

export type InstructorDetailsVehiclesDocCachedV1VehiclesLast6MonthsStats =
  InstructorDetailsVehiclesDocCachedV1Vehicles[typeof LAST_6_MONTHS_STATS];
export type InstructorDetailsVehiclesDocCachedV1VehiclesLast6MonthsStatsUsageEl =
  InstructorDetailsVehiclesDocCachedV1VehiclesLast6MonthsStats[typeof USAGE][0];

export type InstructorDetailsVehiclesDocCachedV1VehiclesVehicleSummary =
  InstructorDetailsVehiclesDocCachedV1Vehicles[typeof VEHICLE_SUMMARY];

export type InstructorDetailsVehiclesDocCachedV1VehiclesVehicleHistorySummary =
  InstructorDetailsVehiclesDocCachedV1Vehicles[typeof VEHICLE_HISTORY_SUMMARY];

export type InstructorDetailsVehiclesDocCachedV1VehiclesVehicleHistorySummaryEl =
  InstructorDetailsVehiclesDocCachedV1VehiclesVehicleHistorySummary[0];
