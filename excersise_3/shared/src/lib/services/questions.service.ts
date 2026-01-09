import { inject, Injectable, signal } from '@angular/core';
import { DocId, FirebaseService } from './firebase.service';
import { TestType } from './_colection.enum';
import { AuthService } from '../auth/auth.service';

export interface QuestionDoc1 {
  questions: {
    questionId: string;
    img: string;
    ans: string;
  }[];
  type: TestType.MEDICAL;
}

export interface QuestionDoc2 {
  questions: {
    answerOptions: {
      answerId: string;
      answerImage: string;
    }[];
    correctAnswerId: string;
    questionId: string;
    questionImage: string;
  }[];
  type: TestType.PSYCHOLOGICAL;
}

export interface QuestionDoc3 {
  questions: {
    answerOptions: {
      answerId: string;
      answer: string;
    }[];
    crossing: boolean;
    correctAnswerIds: string[];
    question: string;
    questionId: string;
    questionImages: string[];
  }[];
  type: TestType.REGULATIONS;
}

export interface QuestionDoc4 {
  questions: {
    answer: string;
    question: string;
    questionId: string;
  }[];
  type: TestType.FIRST_AID;
}

export type QuestionDoc =
  | QuestionDoc1
  | QuestionDoc2
  | QuestionDoc3
  | QuestionDoc4;

@Injectable({
  providedIn: 'root',
})
export class QuestionsService {
  readonly firebase = inject(FirebaseService);
  readonly auth = inject(AuthService);

  constructor() {
    this.fetchAllCollectionInformation();
  }
  readonly collection = 'questions';
  readonly docs = signal<(QuestionDoc & DocId)[]>([]);
  readonly dataFetched = signal(false);

  async fetchAllCollectionInformation() {
    const userId = this.auth.getCurrentUserId();
    if (!userId) throw new Error('User not found');
    await this.fetchQuestions();
    this.dataFetched.set(true);
  }

  async fetchQuestions() {
    const coll = this.collection;
    let docs = await this.firebase.getDocs<QuestionDoc>(coll);
    this.docs.set(docs);
  }

  readonly isMedical = (doc: QuestionDoc): doc is QuestionDoc1 =>
    doc.type === TestType.MEDICAL;
  readonly isPsychological = (doc: QuestionDoc): doc is QuestionDoc2 =>
    doc.type === TestType.PSYCHOLOGICAL;
  readonly isRegulations = (doc: QuestionDoc): doc is QuestionDoc3 =>
    doc.type === TestType.REGULATIONS;
  readonly isFirstAid = (doc: QuestionDoc): doc is QuestionDoc4 =>
    doc.type === TestType.FIRST_AID;
}
