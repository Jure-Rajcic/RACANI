import { inject, Injectable, signal } from '@angular/core';
import { DocId, FirebaseService } from './firebase.service';
import { AuthService } from '../auth/auth.service';
import { Timestamp } from 'firebase/firestore';
import { TestType } from './_colection.enum';

export interface UserTestDoc1 {
  userId: string;
  timeFinished: Timestamp;
  timeStarted: Timestamp;
  qaSet: {
    ans: string;
    questionId: string;
  }[];
  type: TestType.MEDICAL;
}

export interface UserTestDoc2 {
  userId: string;
  timeFinished: Timestamp;
  timeStarted: Timestamp;
  qaSet: {
    ansId: string;
    questionId: string;
  }[];
  type: TestType.PSYCHOLOGICAL;
}

export interface UserTestDoc3 {
  userId: string;
  timeFinished: Timestamp;
  timeStarted: Timestamp;
  qaSet: {
    ansIds: string[];
    questionId: string;
  }[];
  type: TestType.REGULATIONS;
}

export interface UserTestDoc4 {
  userId: string;
  timeFinished: Timestamp;
  timeStarted: Timestamp;
  qaSet: {
    questionId: string;
  }[];
  type: TestType.FIRST_AID;
}

export type UserTestDoc = UserTestDoc1 | UserTestDoc2 | UserTestDoc3 | UserTestDoc4;
export type UserTestDocWithoutUserId =
  | Omit<UserTestDoc1, 'userId'>
  | Omit<UserTestDoc2, 'userId'>
  | Omit<UserTestDoc3, 'userId'>
  | Omit<UserTestDoc4, 'userId'>;

@Injectable({
  providedIn: 'root',
})
export class UserTestsService {
  readonly firebase = inject(FirebaseService);
  readonly auth = inject(AuthService);

  constructor() {
    this.fetchAllCollectionInformation();
  }
  readonly collection = 'user-test';
  readonly docs = signal<(UserTestDoc & DocId)[]>([]);
  readonly dataFetched = signal(false);

  async fetchAllCollectionInformation() {
    const userId = this.auth.getCurrentUserId();
    if (!userId) throw new Error('User not found');
    await this.fetchUserTests(userId);
    this.dataFetched.set(true);
  }

  async fetchUserTests(userId: string) {
    let docs = await this.firebase.getDocs<UserTestDoc>(this.collection);
    docs = docs.filter(doc => doc.userId === userId);
    this.docs.set(docs);
  }

  async createUserTest(partialDoc: UserTestDocWithoutUserId): Promise<string> {
    const docComplete: UserTestDoc = {
      ...partialDoc,
      userId: this.auth.getCurrentUserId()!,
    };
    const docId = await this.firebase.addDoc(this.collection, docComplete);
    await this.fetchAllCollectionInformation();
    return docId;
  }

  async deleteUserTest(docId: string) {
    this.docs.set(this.docs().filter(doc => doc.docId !== docId));
    await this.firebase.deleteDoc(this.collection, docId);
  }

  readonly isMedical = (doc: UserTestDoc): doc is UserTestDoc1 => doc.type === TestType.MEDICAL;
  readonly isPsychological = (doc: UserTestDoc): doc is UserTestDoc2 => doc.type === TestType.PSYCHOLOGICAL;
  readonly isRegulations = (doc: UserTestDoc): doc is UserTestDoc3 => doc.type === TestType.REGULATIONS;
  readonly isFirstAid = (doc: UserTestDoc): doc is UserTestDoc4 => doc.type === TestType.FIRST_AID;
}
