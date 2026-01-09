import { inject, Injectable, signal } from '@angular/core';
import { DocId, FirebaseService } from './firebase.service';
import { AuthService } from '../auth/auth.service';

export interface ContactDoc {
  name: string;
  avatarURL: string;
  description: string;
  phone?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

//TODO doc now looks like this
// export interface Doc {
//   name: string;
//   img: string;
//   description: string;
//   contact: {
//     phone?: string;
//     facebook?: string;
//     instagram?: string;
//     twitter?: string;
//   }
// }


@Injectable({
  providedIn: 'root',
})
export class ContactsService {
  readonly firebase = inject(FirebaseService);
  readonly auth = inject(AuthService);

  constructor() {
    this.fetchAllCollectionInformation();
  }

  readonly docs = signal<(ContactDoc & DocId)[]>([]);
  readonly dataFetched = signal(false);

  async fetchAllCollectionInformation() {
    const userId = this.auth.getCurrentUserId();
    if (!userId) throw new Error('User not found');
    await this.fetchContacts(userId);
    this.dataFetched.set(true);
  }

  // TODO doadat filter tako da samo user moze procitat one podatke koje smije npr nova vezna tablica user can read...
  async fetchContacts(userId: string) {
    const coll = 'contacts';
    const docs = await this.firebase.getDocs<ContactDoc>(coll);
    this.docs.set(docs);
  }
}
