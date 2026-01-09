import { inject, Injectable, linkedSignal, signal, Signal, WritableSignal } from '@angular/core';
import { DeepPartial } from '@utils/common';
import {
  INSTRUCTOR_DETAILS_STUDENTS_ABSOLUTE_PATH,
  InstructorDetailsStudentsDocCachedV1,
} from '@models/admin/read/details/instructor-details-students.collection';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';

import { DOC_TYPE, DOC_TYPE_CASHED, DOC_VERSION, DOC_VERSION_V1 } from '@utils/constants';
import { FirebaseService } from '@auth-demo/auth-lib';
import { ADMIN_READONLY_COLL, ADMIN_READONLY_DETAILS_DOC } from '@models/admin/read/read.doc';
import { ADMIN_APP_COLL, ADMIN_APP_DOC } from '@models/admin/base.doc';

type InstructorDocId = string;
type DeepPartialCashedDoc = DeepPartial<InstructorDetailsStudentsDocCachedV1>;
type DeepPartialCashedDocReadOnlySignal = Signal<DeepPartialCashedDoc | undefined | null>;
type DeepPartialCashedDocWritableSignal = WritableSignal<DeepPartialCashedDoc | undefined | null>;

@Injectable({
  providedIn: 'root',
})
export class CashedInstructorStudentDetailsService {
  readonly db = inject(FirebaseService).db;
  readonly cashedProfileDocs = new Map<InstructorDocId, DeepPartialCashedDocReadOnlySignal>();

  linkTo(instructorId: string): DeepPartialCashedDocReadOnlySignal {
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

  private async fetchFirestoreData(instructorId: InstructorDocId, sig: DeepPartialCashedDocWritableSignal) {
    const collectionRef = collection(this.db, INSTRUCTOR_DETAILS_STUDENTS_ABSOLUTE_PATH);
    try {
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
      const docCashed = docsSnapshot.docs[0].data() as DeepPartial<InstructorDetailsStudentsDocCachedV1>;
      if (docCashed === undefined) {
        console.error('Cached profile document is undefined');
        sig.set(null);
        return;
      }
      sig.set(docCashed);
    } catch (error) {
      console.error('Error fetching cached profile document:', error);
      sig.set(null);
    }
  }
}
