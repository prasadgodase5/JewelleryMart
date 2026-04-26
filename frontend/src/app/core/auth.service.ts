import { Injectable, signal, computed } from '@angular/core';

export type UserRole = 'user' | 'admin';

export interface AuthUser {
  username: string;
  role: UserRole;
  phone: string;
}

const STORAGE_KEY = 'pg_emart_auth';
const VALID_USERNAME = 'prasad';
const VALID_PASSWORD = '9604';
const USER_PHONE = '9604062216';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private current = signal<AuthUser | null>(this.loadInitial());

  user = computed(() => this.current());
  isAuthenticated = computed(() => this.current() !== null);
  role = computed(() => this.current()?.role ?? null);
  username = computed(() => this.current()?.username ?? '');
  phone = computed(() => this.current()?.phone ?? '');

  login(username: string, password: string, role: UserRole): boolean {
    if (username.trim().toLowerCase() === VALID_USERNAME && password === VALID_PASSWORD) {
      const u: AuthUser = { username: VALID_USERNAME, role, phone: USER_PHONE };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch {}
      this.current.set(u);
      return true;
    }
    return false;
  }

  logout(): void {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    this.current.set(null);
  }

  defaultLanding(): string {
    return this.role() === 'admin' ? '/admin/dashboard' : '/user/shop';
  }

  private loadInitial(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.role === 'admin' || parsed.role === 'user')) return parsed as AuthUser;
    } catch {}
    return null;
  }
}
