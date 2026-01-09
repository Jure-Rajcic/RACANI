import { inject, Injectable, signal } from '@angular/core';
import { DocId, FirebaseService } from './firebase.service';
import { AuthService } from '../auth/auth.service';

export interface UserPlanDoc {
  userId: string;
  priceSheet: {
    id: string;
    label: string;
    total: number;
    includes?: string[];
  }[];
  discountSheet: {
    id: string;
    label: string;
    total: number;
    includes?: string[];
  }[];
  extra: {
    expenses: UserPlanDocEE[];
    discounts: UserPlanDocED[];
  };
  locked: boolean;
}

type UserPlanDocEE = UserPlanDocEE1 | UserPlanDocEE2;

interface UserPlanDocEE1 {
  type: EET.MEDICAL_EXAM_FAIL;
  cost: number;
}

interface UserPlanDocEE2 {
  type: EET.PSYCHOLOGICAL_EXAM_FAIL;
  cost: number;
}

enum EET {
  MEDICAL_EXAM_FAIL,
  PSYCHOLOGICAL_EXAM_FAIL,
  REGULATION_FAIL,
  DRIVING_EXAM_FAIL,
  OTHER,
}

type UserPlanDocED = UserPlanDocED1 | UserPlanDocED2;

// TODO mozda nekakv suport za date
interface UserPlanDocED1 {
  type: EDT.FIXED_AMOUNT;
  amount: number;
}

interface UserPlanDocED2 {
  type: EDT.PERCENTAGE;
  percentage: number;
}

enum EDT {
  FIXED_AMOUNT,
  PERCENTAGE,
  OTHER,
}

export type UserPlanDocWithoutUserId = Omit<UserPlanDoc, 'userId'>;

@Injectable({
  providedIn: 'root',
})
export class UserPlanService {
  readonly firebase = inject(FirebaseService);
  readonly auth = inject(AuthService);

  constructor() {
    this.fetchAllCollectionInformation();
  }

  readonly collection = 'user-plan-service';
  readonly docs = signal<(UserPlanDoc & DocId)[]>([]);
  readonly dataFetched = signal(false);

  async fetchAllCollectionInformation() {
    const userId = this.auth.getCurrentUserId();
    if (!userId) throw new Error('User not found');
    await this.fetchUserPlan(userId);
    this.dataFetched.set(true);
  }

  async fetchUserPlan(userId: string) {
    let docs = await this.firebase.getDocs<UserPlanDoc>(this.collection);
    docs = docs.filter((doc) => doc.userId === userId);
    this.docs.set(docs);
  }

  // async createUserTest(partialDoc: DocWithoutUserId): Promise<string> {
  //   const docComplete: Doc = {
  //     ...partialDoc,
  //     userId: this.auth.getCurrentUserId()!,
  //   };
  //   const docId = await this.firebase.addDoc(this.collection, docComplete);
  //   await this.fetchAllCollectionInformation();
  //   return docId;
  // }

  // async deleteUserTest(docId: string) {
  //   this.docs.set(this.docs().filter((doc) => doc.docId !== docId));
  //   await this.firebase.deleteDoc(this.collection, docId);
  // }

  readonly isMedicalFailExpense = (doc: UserPlanDocEE): doc is UserPlanDocEE1 =>
    doc.type === EET.MEDICAL_EXAM_FAIL;
  readonly isPsychologicalFailExpense = (
    doc: UserPlanDocEE
  ): doc is UserPlanDocEE2 => doc.type === EET.PSYCHOLOGICAL_EXAM_FAIL;

  readonly isFixedAmountDiscount = (
    doc: UserPlanDocED
  ): doc is UserPlanDocED1 => doc.type === EDT.FIXED_AMOUNT;
  readonly isPercentageDiscount = (doc: UserPlanDocED): doc is UserPlanDocED2 =>
    doc.type === EDT.PERCENTAGE;
}
