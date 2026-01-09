import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { DocId, FirebaseService } from './firebase.service';

export interface UserInfoDoc {
  name: string;
  surname: string;
  sex: 'M' | 'F';
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserInfoService {
  readonly firebase = inject(FirebaseService);
  readonly auth = inject(AuthService);

  constructor() {
    this.fetchAllCollectionInformation();
  }

  readonly collection = 'user-info';
  readonly docs = signal<(UserInfoDoc & DocId)[]>([]);
  readonly dataFetched = signal(false);

  async fetchAllCollectionInformation() {
    const userId = this.auth.getCurrentUserId();
    if (!userId) throw new Error('User not found');
    await this.fetchUserInfos();
    this.dataFetched.set(true);
  }

  async fetchUserInfos() {
    const coll = this.collection;
    const docs = await this.firebase.getDocs<UserInfoDoc>(coll);
    this.docs.set(docs);
    console.log('Fetched user infos:', docs);
  }


}
