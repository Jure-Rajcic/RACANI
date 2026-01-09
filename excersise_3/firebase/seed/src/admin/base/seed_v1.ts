import { Firestore, Timestamp } from 'firebase-admin/firestore';

import { DOC_CREATED_AT, DOC_ID, DOC_VERSION, DOC_VERSION_V1 } from '@utils/constants';
import { ADMIN_APP_COLL, AdminAppDocV1, ADMIN_APP_DOC } from '@models/admin/base.doc';
import { CLIENT_APP_COLL, ClientAppDocV1, CLIENT_APP_DOC } from '@models/client/base.doc';
import { environment } from '@env/environment.dev';

export async function seedV1(db: Firestore) {
  const adminCollectionRef = db.collection(ADMIN_APP_COLL);
  const clientCollectionRef = db.collection(CLIENT_APP_COLL);

  const batch = db.batch();
  const today = new Date(Date.now());

  const adminDocRef = adminCollectionRef.doc(ADMIN_APP_DOC);
  const clientDocRef = clientCollectionRef.doc(CLIENT_APP_DOC);

  const drivingSchoolId = environment.drivingSchoolId;
  const adminDoc: AdminAppDocV1 = {
    [DOC_ID]: adminDocRef.id,
    [DOC_VERSION]: DOC_VERSION_V1,
    [DOC_CREATED_AT]: Timestamp.fromDate(today),
    drivingSchoolId: drivingSchoolId,
    adminDocId: adminDocRef.id,
    relatedClientDocId: clientDocRef.id,
  };
  batch.set(adminDocRef, adminDoc);

  const clientDoc: ClientAppDocV1 = {
    [DOC_ID]: clientDocRef.id,
    [DOC_VERSION]: DOC_VERSION_V1,
    [DOC_CREATED_AT]: Timestamp.fromDate(today),
    drivingSchoolId: environment.drivingSchoolId,
    clientDocId: clientDocRef.id,
    relatedAdminDocId: adminDocRef.id,
  };
  batch.set(clientDocRef, clientDoc);

  await batch.commit();
}
