import { DOC_CREATED_AT, DOC_VERSION, DOC_VERSION_V1, DOC_ID } from '@utils/constants';
import { Timestamp } from 'firebase-admin/firestore';
import { environment } from '@env/environment.dev';

export const CLIENT_APP_COLL = 'client-app-collection';
export const CLIENT_APP_DOC = environment.drivingSchoolId;

export interface ClientAppDocV1 {
  [DOC_ID]: string;
  [DOC_VERSION]: typeof DOC_VERSION_V1;
  [DOC_CREATED_AT]: Timestamp;
  drivingSchoolId: string;
  clientDocId: string;
  relatedAdminDocId: string;
}
