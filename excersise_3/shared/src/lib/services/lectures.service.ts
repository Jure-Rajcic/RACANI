import { inject, Injectable, signal } from '@angular/core';
import { DocId, FirebaseService } from './firebase.service';
import { AuthService } from '../auth/auth.service';

export enum LectureType {
  REGULATIONS_LECTURES,
  FIRST_AID_LECTURES,
  DRIVING_LECTURES,
}

export interface LectureDoc1 {
  section: string;
  title: string;
  videoURL: string;
  duration: number;
  type: LectureType.REGULATIONS_LECTURES;
}

export interface LectureDoc2 {
  section: string;
  title: string;
  videoURL: string;
  duration: number;
  type: LectureType.FIRST_AID_LECTURES;
}

export type LectureDoc = LectureDoc1 | LectureDoc2;

@Injectable({
  providedIn: 'root',
})
export class LecturesService {
  readonly firebase = inject(FirebaseService);
  readonly auth = inject(AuthService);

  constructor() {
    this.fetchAllCollectionInformation();
  }
  readonly collection = 'lectures';
  readonly docs = signal<(LectureDoc & DocId)[]>([]);
  readonly dataFetched = signal(false);

  async fetchAllCollectionInformation() {
    const userId = this.auth.getCurrentUserId();
    if (!userId) throw new Error('User not found');
    await this.fetchLectures();
    this.dataFetched.set(true);
  }

  async fetchLectures() {
    const coll = this.collection;
    let docs = await this.firebase.getDocs<LectureDoc>(coll);
    this.docs.set(docs);
  }

  readonly isRegulations = (doc: LectureDoc): doc is LectureDoc1 => doc.type === LectureType.REGULATIONS_LECTURES;
  readonly isFirstAid = (doc: LectureDoc): doc is LectureDoc2 => doc.type === LectureType.FIRST_AID_LECTURES;
}
