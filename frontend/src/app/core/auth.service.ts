import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiService } from './api.service';

export type UserRole = 'user' | 'admin';

export interface AuthUser {
  username: string;
  name: string;
  role: UserRole;
  phone: string;
}

const STORAGE_KEY = 'pg_emart_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private current = signal<AuthUser | null>(this.loadInitial());

  user = computed(() => this.current());
  isAuthenticated = computed(() => this.current() !== null);
  role = computed(() => this.current()?.role ?? null);
  username = computed(() => this.current()?.username ?? '');
  fullName = computed(() => this.current()?.name ?? '');
  phone = computed(() => this.current()?.phone ?? '');

  login(username: string, password: string, role: UserRole): Observable<boolean> {
    const apiRole: 'admin' | 'customer' = role === 'admin' ? 'admin' : 'customer';
    return this.api.login(username, password, apiRole).pipe(
      map(u => {
        const local: AuthUser = {
          username: u.username,
          name: u.name,
          role: u.role === 'admin' ? 'admin' : 'user',
          phone: u.phone || ''
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(local)); } catch {}
        this.current.set(local);
        return true;
      }),
      catchError(err => {
        const msg = err?.error?.error || err?.message || 'Login failed';
        return throwError(() => new Error(msg));
      })
    );
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
