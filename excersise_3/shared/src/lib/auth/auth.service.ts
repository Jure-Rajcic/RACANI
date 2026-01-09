import { Injectable, signal } from '@angular/core';
import { getAuth, signInWithEmailAndPassword, User, Auth, onAuthStateChanged, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { environment } from '../../../../environment/environment.dev';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly #auth: Auth;
  private currentUser = signal<User | null>(null);

  constructor() {
    const app = initializeApp(environment.firebaseConfig);
    this.#auth = getAuth(app);

    // Listen to auth state changes
    onAuthStateChanged(this.#auth, (user: User | null) => {
      this.currentUser.set(user);
      console.log('AuthStateChanged: ', user);
    });
  }

  // Sign in method
  async login(email: string, password: string): Promise<void> {
    const uc = await signInWithEmailAndPassword(this.#auth, email, password);
    this.currentUser.set(uc.user);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  // Logout method
  async logout(): Promise<void> {
    await signOut(this.#auth);
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.currentUser() ? this.currentUser()!.uid : null;
  }

  // Expose the current user signal as a getter
  get user() {
    return this.currentUser;
  }
}
