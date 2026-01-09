import { inject, Injectable, linkedSignal, signal, Signal, WritableSignal } from '@angular/core';
import { DeepPartial } from '@utils/common';
import {
  INSTRUCTOR_DETAILS_PROFILE_ABSOLUTE_PATH,
  InstructorDetailsProfileDocCachedV1,
  DocCachedV1Profile,
} from '@models/admin/read/details/instructor-details-profile.collection';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';

import { DOC_TYPE, DOC_TYPE_CASHED, DOC_VERSION, DOC_VERSION_V1 } from '@utils/constants';
import { FirebaseService } from '@auth-demo/auth-lib';
import { ADMIN_APP_COLL, ADMIN_APP_DOC } from '@models/admin/base.doc';
import { ADMIN_READONLY_COLL, ADMIN_READONLY_DETAILS_DOC } from '@models/admin/read/read.doc';

type InstructorDocId = string;
type DeepPartialCashedProfile = DeepPartial<DocCachedV1Profile>;
type DeepPartialCashedProfileReadOnlySignal = Signal<DeepPartialCashedProfile | undefined | null>;
type DeepPartialCashedProfileWritableSignal = WritableSignal<DeepPartialCashedProfile | undefined | null>;

type DeepPartialCashedDoc = DeepPartial<InstructorDetailsProfileDocCachedV1>;

@Injectable({
  providedIn: 'root',
})
export class CashedVehiclesProfileDetailsService {
  readonly db = inject(FirebaseService).db;
  readonly cashedProfileDocs = new Map<InstructorDocId, DeepPartialCashedProfileReadOnlySignal>();

  linkTo(instructorId: string): DeepPartialCashedProfileReadOnlySignal {
    this.preprocessCashedProfileDoc(instructorId);
    const cashedProfileDocSignal = this.cashedProfileDocs.get(instructorId)!;
    return cashedProfileDocSignal;
  }

  private preprocessCashedProfileDoc(instructorId: InstructorDocId) {
    if (this.cashedProfileDocs.has(instructorId)) return;
    const sig = signal(undefined);
    this.cashedProfileDocs.set(instructorId, sig);
    this.fetchFirestoreData(instructorId, sig);
  }

  private async fetchFirestoreData(instructorId: InstructorDocId, sig: DeepPartialCashedProfileWritableSignal) {
    const collectionRef = collection(this.db, INSTRUCTOR_DETAILS_PROFILE_ABSOLUTE_PATH);
    try {
      console.log(`\x1b[34mFetching cached vehicle details document for instructor: ${instructorId}\x1b[0m`);
      const docsSnapshot = await getDocs(
        query(
          collectionRef,
          where(DOC_TYPE, 'in', [DOC_TYPE_CASHED]),
          where(DOC_VERSION, '==', DOC_VERSION_V1),
          where('instructorId', '==', instructorId),
        ),
      );

      if (docsSnapshot.empty) {
        console.error('No cached profile document found for instructor');
        sig.set(null);
        return;
      }
      if (docsSnapshot.docs.length > 1) {
        console.error('Multiple cached profile documents found for instructor');
        sig.set(null);
        return;
      }
      const doc = docsSnapshot.docs[0].data() as DeepPartialCashedDoc;
      if (doc === undefined) {
        console.error('Cached profile document is undefined');
        sig.set(null);
        return;
      }
      if (doc.profile === undefined) {
        console.error('Cached profile document profile is undefined');
        sig.set(null);
        return;
      }
      const docProfile = doc.profile;
      sig.set(docProfile);
    } catch (error) {
      console.error('Error fetching cached profile document:', error);
      sig.set(null);
    }
  }
}
