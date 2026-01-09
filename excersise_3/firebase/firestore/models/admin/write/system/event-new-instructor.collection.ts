import {
  DOC_ACTOR_ROLE,
  ActorRoleType,
  DOC_ACTOR_ID,
  DOC_CREATED_AT,
  DOC_TYPE,
  DOC_TYPE_CREATION,
  DOC_VERSION,
  DOC_VERSION_V1,
  DOC_ID,
} from '@utils/constants';
import { Timestamp } from 'firebase-admin/firestore';
import { ADMIN_APP_COLL, ADMIN_APP_DOC } from '@models/admin/base.doc';
import { ADMIN_WRITEONLY_COLL, ADMIN_WRITEONLY_SYSTEM_DOC } from '@write/write.doc';

const EVENT_NEW_INSTRUCTOR = 'event-new-instructor';
export const EVENT_NEW_INSTRUCTOR_ABSOLUTE_PATH = [
  ADMIN_APP_COLL,
  ADMIN_APP_DOC,
  ADMIN_WRITEONLY_COLL,
  ADMIN_WRITEONLY_SYSTEM_DOC,
  EVENT_NEW_INSTRUCTOR,
].join('/');

export type EventNewInstructorDocV1 = {
  [DOC_ID]: string;
  [DOC_TYPE]: typeof DOC_TYPE_CREATION;
  [DOC_VERSION]: typeof DOC_VERSION_V1;
  [DOC_ACTOR_ID]: string;
  [DOC_ACTOR_ROLE]: ActorRoleType;
  [DOC_CREATED_AT]: Timestamp;
  instructorId: string;
};
