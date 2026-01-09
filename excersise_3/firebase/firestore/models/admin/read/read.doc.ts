import { DOC_ID, DocIdType } from '@utils/constants';

export const ADMIN_READONLY_COLL = 'readonly-coll';
export const ADMIN_READONLY_STATS_DOC = 'stats-collections';
export const ADMIN_READONLY_LISTS_DOC = 'lists-collections';
export const ADMIN_READONLY_DETAILS_DOC = 'details-collections';

export interface AdminReadDocV1 {
  [DOC_ID]: DocIdType;
}
