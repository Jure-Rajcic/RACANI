import { DOC_ID, DocIdType } from '@utils/constants';

export const ADMIN_WRITEONLY_COLL = 'writeonly-coll';
export const ADMIN_WRITEONLY_FORMS_DOC = 'forms-collections';
export const ADMIN_WRITEONLY_SYSTEM_DOC = 'system-collections';
export const ADMIN_WRITEONLY_CHANNEL_DOC = 'channel-collections';

export interface AdminWriteDocV1 {
  [DOC_ID]: DocIdType;
}
