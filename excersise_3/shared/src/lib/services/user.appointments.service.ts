import { inject, Injectable, signal } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { LS } from './_colection.enum';
import { DocId, FirebaseService } from './firebase.service';
import { AuthService } from '../auth/auth.service';
//TODO napravit da uzer ima svoje kolekcije u fb koje se ticu samo njega i da samo on ima oblasti preko svog uid da ih reada i writa
// admin ima ovlasti da vidi sve i da upravlja svime!!!!!! i ove statuse napravit tako da su string caps lock
export enum UserAppointmentAS {
  UNASSIGNED,
  IN_REVIEW,
  CONFIRMED,
  DECLINED,
}

export enum UserAppointmentType {
  MEDICAL_EXAM,
  PSYCHOLOGICAL_EXAM,
  PLAN,
  REGULATIONS_LECTURES,
  REGULATIONS_EXAM,
  FIRST_AID_LECTURES,
  FIRST_AID_EXAM,
  DRIVING_LECTURES,
  DRIVING_EXAM,
  LICENSE,
}

export interface UserAppointmentDoc1 {
  as: UserAppointmentAS;
  contactId: string;
  location: string;
  timestamp: Timestamp;
  type: UserAppointmentType.MEDICAL_EXAM;
  userId: string;
}

export interface UserAppointmentDoc2 {
  as: UserAppointmentAS;
  contactId: string;
  location: string;
  timestamp: Timestamp;
  type: UserAppointmentType.PSYCHOLOGICAL_EXAM;
  userId: string;
}

type DocASU = (UserAppointmentDoc1 | UserAppointmentDoc2) & {
  as: UserAppointmentAS.UNASSIGNED;
};
type DocASI = (UserAppointmentDoc1 | UserAppointmentDoc2) & {
  as: UserAppointmentAS.IN_REVIEW;
};
type DocASC = (UserAppointmentDoc1 | UserAppointmentDoc2) & {
  as: UserAppointmentAS.CONFIRMED;
};
type DocASD = (UserAppointmentDoc1 | UserAppointmentDoc2) & { as: UserAppointmentAS.DECLINED };

export interface UserAppointmentDoc3 {
  contactId: string;
  lectureId: string;
  location: string;
  ls: LS;
  timestamp: Timestamp;
  type: UserAppointmentType.REGULATIONS_LECTURES;
  userId: string;
}

type DocLSA = (UserAppointmentDoc3 | UserAppointmentDoc5) & { ls: LS.ATTENDED };
type DocLSM = (UserAppointmentDoc3 | UserAppointmentDoc5) & { ls: LS.MISSED };
type DocLSC = (UserAppointmentDoc3 | UserAppointmentDoc5) & { ls: LS.CURRENT };
type DocLSU = (UserAppointmentDoc3 | UserAppointmentDoc5) & { ls: LS.UPCOMING };

export interface UserAppointmentDoc4 {
  as: UserAppointmentAS;
  contactId: string;
  location: string;
  timestamp: Timestamp;
  type: UserAppointmentType.REGULATIONS_EXAM;
  userId: string;
}

export interface UserAppointmentDoc5 {
  contactId: string;
  lectureId: string;
  location: string;
  ls: LS;
  timestamp: Timestamp;
  type: UserAppointmentType.FIRST_AID_LECTURES;
  userId: string;
}

export interface UserAppointmentDoc6 {
  as: UserAppointmentAS;
  contactId: string;
  location: string;
  timestamp: Timestamp;
  type: UserAppointmentType.FIRST_AID_EXAM;
  userId: string;
}

//TODO make it in a way i can make routeUrl and mistakes optional for Current and upcoming lectures
export interface UserAppointmentDoc7 {
  contactId: string;
  location: string;
  ls: LS;
  timestamp: Timestamp;
  type: UserAppointmentType.DRIVING_LECTURES;
  userId: string;
  routeURL: string;
  mistakes: {
    mistakeId: string;
    description: string;
  }[];
}

export interface UserAppointmentDoc8 {
  as: UserAppointmentAS;
  contactId: string;
  location: string;
  timestamp: Timestamp;
  type: UserAppointmentType.DRIVING_EXAM;
  userId: string;
}

export interface UserAppointmentDoc9 {
  as: UserAppointmentAS;
  contactId: string;
  location: string;
  timestamp: Timestamp;
  type: UserAppointmentType.LICENSE;
  userId: string;
}

export type UserAppointmentDoc =
  | UserAppointmentDoc1
  | UserAppointmentDoc2
  | UserAppointmentDoc3
  | UserAppointmentDoc4
  | UserAppointmentDoc5
  | UserAppointmentDoc6
  | UserAppointmentDoc7
  | UserAppointmentDoc8
  | UserAppointmentDoc9;
export type UserAppointmentDocWithoutUserId =
  | Omit<UserAppointmentDoc1, 'userId'>
  | Omit<UserAppointmentDoc2, 'userId'>
  | Omit<UserAppointmentDoc3, 'userId'>
  | Omit<UserAppointmentDoc4, 'userId'>
  | Omit<UserAppointmentDoc5, 'userId'>
  | Omit<UserAppointmentDoc6, 'userId'>
  | Omit<UserAppointmentDoc7, 'userId'>
  | Omit<UserAppointmentDoc8, 'userId'>
  | Omit<UserAppointmentDoc9, 'userId'>;

@Injectable({
  providedIn: 'root',
})
export class UserAppointmentsService {
  readonly firebase = inject(FirebaseService);
  readonly auth = inject(AuthService);
  readonly collection = 'user-appointments';

  constructor() {
    this.fetchAllCollectionInformation();
  }

  readonly docs = signal<(UserAppointmentDoc & DocId)[]>([]);
  readonly dataFetched = signal(false);

  async fetchAllCollectionInformation() {
    this.dataFetched.set(false);
    const userId = this.auth.getCurrentUserId();
    if (!userId) throw new Error('User not found');
    await this.fetchUserAppointments(userId);
    this.dataFetched.set(true);
  }

  async fetchUserAppointments(userId: string) {
    const coll = this.collection;
    let docs = await this.firebase.getDocs<UserAppointmentDoc>(coll);
    docs = docs.filter((doc) => doc.userId === userId);
    this.docs.set(docs);
  }

  readonly isMedicalExam = (
    doc: UserAppointmentDoc
  ): doc is UserAppointmentDoc1 => doc.type === UserAppointmentType.MEDICAL_EXAM;
  readonly isPsychologicalExam = (
    doc: UserAppointmentDoc
  ): doc is UserAppointmentDoc2 => doc.type === UserAppointmentType.PSYCHOLOGICAL_EXAM;
  readonly isRegulationsLectures = (
    doc: UserAppointmentDoc
  ): doc is UserAppointmentDoc3 => doc.type === UserAppointmentType.REGULATIONS_LECTURES;
  readonly isRegulationsExam = (
    doc: UserAppointmentDoc
  ): doc is UserAppointmentDoc4 => doc.type === UserAppointmentType.REGULATIONS_EXAM;
  readonly isFirstAidLectures = (
    doc: UserAppointmentDoc
  ): doc is UserAppointmentDoc5 => doc.type === UserAppointmentType.FIRST_AID_LECTURES;
  readonly isFirstAidExam = (
    doc: UserAppointmentDoc
  ): doc is UserAppointmentDoc6 => doc.type === UserAppointmentType.FIRST_AID_EXAM;
  readonly isDrivingLectures = (
    doc: UserAppointmentDoc
  ): doc is UserAppointmentDoc7 => doc.type === UserAppointmentType.DRIVING_LECTURES;
  readonly isDrivingExam = (
    doc: UserAppointmentDoc
  ): doc is UserAppointmentDoc8 => doc.type === UserAppointmentType.DRIVING_EXAM;
  readonly isLicense = (doc: UserAppointmentDoc): doc is UserAppointmentDoc9 =>
    doc.type === UserAppointmentType.LICENSE;

  readonly isUnassigned = (
    doc:
      | UserAppointmentDoc1
      | UserAppointmentDoc2
      | UserAppointmentDoc4
      | UserAppointmentDoc6
      | UserAppointmentDoc8
      | UserAppointmentDoc9
  ): doc is DocASU => doc.as === UserAppointmentAS.UNASSIGNED;
  readonly isInReview = (
    doc:
      | UserAppointmentDoc1
      | UserAppointmentDoc2
      | UserAppointmentDoc4
      | UserAppointmentDoc6
      | UserAppointmentDoc8
      | UserAppointmentDoc9
  ): doc is DocASI => doc.as === UserAppointmentAS.IN_REVIEW;
  readonly isConfirmed = (
    doc:
      | UserAppointmentDoc1
      | UserAppointmentDoc2
      | UserAppointmentDoc4
      | UserAppointmentDoc6
      | UserAppointmentDoc8
      | UserAppointmentDoc9
  ): doc is DocASC => doc.as === UserAppointmentAS.CONFIRMED;
  readonly isDeclined = (
    doc:
      | UserAppointmentDoc1
      | UserAppointmentDoc2
      | UserAppointmentDoc4
      | UserAppointmentDoc6
      | UserAppointmentDoc8
      | UserAppointmentDoc9
  ): doc is DocASD => doc.as === UserAppointmentAS.DECLINED;

  readonly isAttended = (
    doc: UserAppointmentDoc3 | UserAppointmentDoc5 | UserAppointmentDoc7
  ): doc is DocLSA => doc.ls === LS.ATTENDED;
  readonly isMissed = (
    doc: UserAppointmentDoc3 | UserAppointmentDoc5 | UserAppointmentDoc7
  ): doc is DocLSM => doc.ls === LS.MISSED;
  readonly isCurrent = (
    doc: UserAppointmentDoc3 | UserAppointmentDoc5 | UserAppointmentDoc7
  ): doc is DocLSC => doc.ls === LS.CURRENT;
  readonly isUpcoming = (
    doc: UserAppointmentDoc3 | UserAppointmentDoc5 | UserAppointmentDoc7
  ): doc is DocLSU => doc.ls === LS.UPCOMING;

  async updateDocs(partialDocs: (UserAppointmentDocWithoutUserId & DocId)[]) {
    const coll = this.collection;
    partialDocs.forEach(async (partialDoc) => {
      const { docId, ...doc } = partialDoc;
      const docComplete: UserAppointmentDoc = {
        ...doc,
        userId: this.auth.getCurrentUserId()!,
      };
      await this.firebase.updateDoc(coll, docId, docComplete);
    });
  }
}
