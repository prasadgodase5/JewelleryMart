import { Injectable, inject, signal } from '@angular/core';
import {
  Auth, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, User
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();

  constructor() {
    onAuthStateChanged(this.auth, u => this._user.set(u));
  }

  isLoggedIn(): boolean {
    return this._user() !== null;
  }

  async login(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    return cred.user;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
