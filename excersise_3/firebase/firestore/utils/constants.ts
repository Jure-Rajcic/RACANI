// import { GeoPoint } from 'firebase-admin/firestore';
import { environment } from '@env/environment.dev';

export const ADMIN_APP_COLL = 'admin-app-collection';
export const ADMIN_APP_DOC = environment.drivingSchoolId;

export const DOC_TYPE = '_docType';
export const DOC_TYPE_CASHED = 'cashed';
export const DOC_TYPE_CREATION = 'creation';
export const DOC_TYPE_EDIT = 'edit';

export const DOC_VERSION = '_docVersion';
export const DOC_VERSION_V1 = 'v1';

export const DOC_MONTH = 'month';
export type DocMonthType = `${number}-${number}`;

export const DOC_ID = '_id';
export type DocIdType = string;

export const DOC_ACTOR_ID = '_actorId';
export const DOC_ACTOR_ROLE = '_actorRole';
export type ActorRoleType = 'admin' | 'instructor' | 'client' | 'developer' | 'script';

export const DOC_CREATED_AT = '_createdAt';

// TODO: JR THIS is not util!! shoudl be place somewhere else !!!
